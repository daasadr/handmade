import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AiOptimization } from './ai-optimization.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { User, UserPlan, isVipActive } from '../users/user.entity';
import { EtsyService } from '../common/etsy/etsy.service';
import { computeMarketScore, buildMarketConclusion } from './market-score';
import { InFlightLock } from './in-flight-lock';

export type Platform = 'etsy' | 'amazon' | 'fler';

// Měsíční limity dle tarifu
const PLAN_LIMITS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 5,
  [UserPlan.MINI]: 30,
  [UserPlan.MIDI]: 150,
  [UserPlan.MAX]: 99999,
};

@Injectable()
export class AiService {
  private anthropic: Anthropic;
  private readonly logger = new Logger(AiService.name);
  private readonly analyzeLock = new InFlightLock();

  constructor(
    @InjectRepository(AiOptimization)
    private optimizationRepo: Repository<AiOptimization>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private etsyService: EtsyService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyze(
    productId: string,
    user: User,
    platform: Platform = 'etsy',
    lang: 'cs' | 'en' = 'cs',
  ) {
    // Zámek proti dvojkliku / dvojímu odeslání: dvě souběžné analýzy téhož
    // produktu+platformy by jinak dvakrát volaly Claude (náš náklad) a založily
    // duplicitní optimalizaci. Klíč je per uživatel+produkt+platforma, takže
    // Etsy a Amazon můžou běžet souběžně. In-memory stačí pro jednu instanci
    // backendu; při více instancích by bylo potřeba zamykat v DB (viz 15.4).
    const lockKey = `${user.id}:${productId}:${platform}`;
    if (!this.analyzeLock.acquire(lockKey)) {
      throw new ConflictException(
        'Analýza tohoto produktu právě probíhá. Počkejte prosím na výsledek.',
      );
    }
    try {
      return await this.performAnalysis(productId, user, platform, lang);
    } finally {
      this.analyzeLock.release(lockKey);
    }
  }

  private async performAnalysis(
    productId: string,
    user: User,
    platform: Platform = 'etsy',
    lang: 'cs' | 'en' = 'cs',
  ) {
    // Kontrola měsíční kvóty
    const limit = PLAN_LIMITS[user.plan];
    const now = new Date();
    const needsReset =
      !user.aiUsageResetAt ||
      user.aiUsageResetAt.getMonth() !== now.getMonth() ||
      user.aiUsageResetAt.getFullYear() !== now.getFullYear();

    const currentUsage = needsReset ? 0 : user.aiUsageThisMonth;

    // VIP kvótu neřeší. Čítač se ale počítá dál — potřebujeme vědět, kolik
    // nás komplimentární účty stojí na API.
    if (!isVipActive(user) && currentUsage >= limit) {
      throw new BadRequestException(
        `Dosáhli jste měsíčního limitu ${limit} optimalizací pro váš tarif. Upgradujte plán pro více optimalizací.`,
      );
    }

    // Vlastnictví ověřeno V DOTAZU (IDOR): analyzovat jde jen vlastní produkt.
    // Cizí i neexistující → 404 (neprozradí, že produkt existuje). Zásada 15.3.
    const product = await this.productRepo.findOne({
      where: { id: productId, maker: { userId: user.id } },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');

    // Fler.cz je český marketplace — výstup má být rovnou v češtině, ne v angličtině.
    const isFler = platform === 'fler';

    const platformInstructions =
      platform === 'etsy'
        ? 'Etsy marketplace (focus on handmade, authentic, artisan qualities; use Etsy SEO best practices)'
        : platform === 'amazon'
          ? 'Amazon Handmade (focus on quality, materials, dimensions; use Amazon search optimization)'
          : 'Fler.cz — český handmade marketplace (důraz na ruční výrobu, český jazyk a lokální kontext; česká SEO klíčová slova, jak je Češi opravdu hledají)';

    const hasImages = product.images && product.images.length > 0;
    const imageAnalysisInstruction = hasImages
      ? `IMPORTANT: I have attached product photo(s). Before writing anything, carefully examine each photo and extract:
- Exact materials and textures visible (fabric type, clay, wood grain, metal, paint medium, etc.)
- Specific colors and color combinations
- Dimensions cues and scale (if objects like hands, cups, coins are visible for reference)
- Artistic technique or craftsmanship details (brushstrokes, stitching, joinery, glaze, etc.)
- Style (rustic, minimalist, bohemian, art deco, etc.)
- Condition and finish quality
- Any unique design elements, patterns, or motifs
Use ONLY what you can actually see — do not invent details not visible in the photos.`
      : '';

    // České překlady chceme jen v české verzi u Etsy/Amazon (Fler je rovnou
    // česky, anglická verze bez překladu).
    const wantCzech = lang === 'cs' && !isFler;

    const langNote = isFler
      ? 'Fler.cz je český trh a čeští zákazníci hledají česky. Napiš celý výstup POUZE ČESKY.'
      : lang === 'en'
        ? 'Output English only. Leave every *_czech field as an empty string.'
        : 'Write the main fields in English. Fill each *_czech field with a Czech translation of the title, description and pricing so the seller understands them.';

    const titleInstr = isFler
      ? 'SEO optimalizovaný název ČESKY, max 140 znaků — s materiály, barvami a technikou z fotky'
      : 'SEO-optimized title in English, max 140 chars — include specific materials, colors and technique from the photo';
    const descInstr = isFler
      ? 'Poutavý, konkrétní popis ČESKY se SEO klíčovými slovy, 150–300 slov. Popiš, čím je kus výjimečný.'
      : 'Vivid, specific description with SEO keywords in English, 150-300 words. Describe what makes this piece unique.';
    const pricingInstr = isFler
      ? 'Stručná cenová strategie ČESKY, 2–3 věty'
      : 'Brief pricing strategy advice in English, 2-3 sentences';

    // Pole na míru dané platformě — přesně to, co se u ní reálně vyplňuje.
    const platformSchema =
      platform === 'amazon'
        ? `  "bullet_points": ["exactly 5 concise benefit-focused key-feature bullets in English, each max ~200 characters"],
  "search_terms": "single line of space-separated backend search keywords in English, no commas, max 240 characters, not shown to buyers",`
        : isFler
          ? `  "tags": ["až 13 českých štítků, každý MAXIMÁLNĚ 20 znaků, malými písmeny, bez interpunkce"],
  "materials": ["až 13 materiálů česky, 1–2 slova každý, např. bavlna, stříbro, ořechové dřevo"],`
          : `  "tags": ["exactly 13 Etsy tags in English, each MAX 20 characters (hard Etsy limit), lowercase, no punctuation"],
  "materials": ["up to 13 materials in English, 1-2 words each, e.g. cotton, sterling silver, walnut wood"],`;

    const promptText = `You are an expert in optimizing product listings for handmade marketplaces.
${imageAnalysisInstruction}
Optimize this handmade product listing for ${platformInstructions}:
- Title: ${product.titleOriginal}
- Description: ${product.descriptionOriginal}
- Category: ${product.category || 'not specified'}
- Current Price: ${product.priceOriginal ? `${product.priceOriginal} EUR` : 'not specified'}

${hasImages ? 'Ground the optimized title and description in the specific visual details you observed in the photos. Mention specific colors, materials, and techniques you can actually see.' : ''}

Respond ONLY with a valid JSON object (no markdown, no explanation). ${langNote}
{
  "optimized_title": "${titleInstr}",
  "title_czech": "${wantCzech ? 'Český překlad optimalizovaného názvu' : ''}",
  "optimized_description": "${descInstr}",
  "description_czech": "${wantCzech ? 'Český překlad optimalizovaného popisu, stejná délka' : ''}",
${platformSchema}
  "pricing_recommendation": "${pricingInstr}",
  "pricing_recommendation_czech": "${wantCzech ? 'Český překlad cenového doporučení' : ''}",
  "competitiveness_score": 75
}`;

    // Přidáme obrázky jako vision content pokud existují (max 4)
    const imageBlocks = (product.images || []).slice(0, 4).map((img) => ({
      type: 'image' as const,
      source: { type: 'url' as const, url: img.imageUrl },
    }));

    const messageContent = hasImages
      ? [...imageBlocks, { type: 'text' as const, text: promptText }]
      : promptText;

    let message: Anthropic.Message;
    try {
      message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: messageContent as any }],
      });
    } catch (err) {
      throw this.translateAnthropicError(err);
    }

    const content = message.content[0];
    if (content.type !== 'text') throw new BadRequestException('Neočekávaná odpověď AI');

    const { parsed, tags, platformFields } = this.parseOptimizationResponse(
      content.text,
      platform,
    );

    // Reálná konkurence z Etsy — jen když je API nakonfigurováno a jde o Etsy.
    // Amazon nemá veřejné vyhledávací API (viz nápověda), takže tam zůstává odhad AI.
    // Selhání Etsy nesmí shodit analýzu — proto se skóre z AI použije jako fallback.
    let scoreSource: 'ai' | 'market' = 'ai';
    let competitivenessScore: number = parsed.competitiveness_score ?? 0;
    let competition: Awaited<ReturnType<EtsyService['searchCompetition']>> = null;
    let marketConclusion: string | undefined;

    if (platform === 'etsy' && this.etsyService.isEnabled()) {
      // Dotaz na trh = pár hlavních tagů (co by zákazník opravdu hledal),
      // fallback na původní název, kdyby AI tagy nevrátila.
      const query = tags.slice(0, 3).join(' ') || product.titleOriginal;
      competition = await this.etsyService.searchCompetition(query);

      if (competition) {
        competitivenessScore = computeMarketScore(
          product.priceOriginal,
          tags,
          competition,
        );
        // Ukládáme JEN tento textový závěr, ne surová data z Etsy (Terms).
        marketConclusion = buildMarketConclusion(
          product.priceOriginal,
          tags,
          competition,
        );
        scoreSource = 'market';
      }
    }

    const optimization = this.optimizationRepo.create({
      productId,
      titleOptimized: parsed.optimized_title,
      titleCzech: parsed.title_czech,
      descriptionOptimized: parsed.optimized_description,
      descriptionCzech: parsed.description_czech,
      keywords: tags,
      platformFields,
      pricingRecommendation: parsed.pricing_recommendation,
      pricingRecommendationCzech: parsed.pricing_recommendation_czech,
      competitivenessScore,
      scoreSource,
      marketConclusion,
      aiModelUsed: 'claude-haiku-4-5',
      platform,
    });
    await this.optimizationRepo.save(optimization);

    await this.productRepo.update(productId, { status: ProductStatus.ANALYZED });

    return {
      optimization,
      // Surová data konkurence — PŘECHODNĚ, jen pro jednorázové zobrazení
      // uživateli. Neukládá se (viz Etsy Terms), po reloadu stránky zmizí.
      competition,
      needsReset,
      newUsage: currentUsage + 1,
    };
  }

  /**
   * Chyby z Anthropic API se bez tohoto překladu zobrazí uživateli jako holé
   * „Internal server error" — a přitom skoro žádnou z nich nemůže sám vyřešit.
   *
   * DŮLEŽITÉ: nikdy nevracíme 401. Frontend na 401 maže token a odhlašuje
   * uživatele (`lib/api.ts`), takže vypršelý API klíč platformy by uživatele
   * vyhodil z účtu.
   */
  private translateAnthropicError(err: unknown): HttpException {
    // Skutečnou příčinu potřebuje správce v logu — uživateli ji neukazujeme.
    this.logger.error(
      `Anthropic API selhalo: ${err instanceof Error ? err.message : String(err)}`,
      err instanceof Error ? err.stack : undefined,
    );

    const kontaktujteSpravce =
      'Zkuste to prosím za chvíli znovu. Pokud potíže potrvají, napište nám — kvóta se vám nestrhla.';

    // POZOR na pořadí: v TS SDK je APIConnectionError podtřída APIError,
    // takže musí jít první — jinak ji odchytí obecná větev níž.
    if (err instanceof Anthropic.APIConnectionError) {
      return new ServiceUnavailableException(
        `Nepodařilo se spojit s AI službou. ${kontaktujteSpravce}`,
      );
    }

    if (err instanceof Anthropic.APIError) {
      // Vyčerpaný kredit platformy. Uživatel s tím nic nezmůže, ať to nezkouší dokola.
      const isBilling =
        err.type === 'billing_error' ||
        /credit balance|billing|insufficient/i.test(err.message ?? '');
      if (isBilling) {
        return new ServiceUnavailableException(
          'AI analýza je dočasně nedostupná kvůli technickému problému na naší straně. ' +
            'Pracujeme na tom — zkuste to prosím později. Kvóta se vám nestrhla.',
        );
      }

      if (err instanceof Anthropic.RateLimitError) {
        return new HttpException(
          `Právě teď probíhá hodně analýz naráz. ${kontaktujteSpravce}`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // 401/403 = špatný nebo chybějící klíč platformy — opět nic pro uživatele.
      if (
        err instanceof Anthropic.AuthenticationError ||
        err instanceof Anthropic.PermissionDeniedError
      ) {
        return new ServiceUnavailableException(
          'AI analýza je dočasně nedostupná kvůli technickému problému na naší straně. ' +
            'Pracujeme na tom — zkuste to prosím později. Kvóta se vám nestrhla.',
        );
      }

      // 500 i 529 (overloaded_error) — přechodné, opakování má smysl.
      if (err.status && err.status >= 500) {
        return new ServiceUnavailableException(
          `AI služba je momentálně přetížená. ${kontaktujteSpravce}`,
        );
      }

      return new ServiceUnavailableException(
        `AI analýzu se nepodařilo dokončit. ${kontaktujteSpravce}`,
      );
    }

    return new ServiceUnavailableException(
      `AI analýzu se nepodařilo dokončit. ${kontaktujteSpravce}`,
    );
  }

  /**
   * Zparsuje odpověď Claude (stripne markdown) a vytáhne tagy + platformFields
   * se stejnými limity jako analyze (Etsy tag ≤20 zn., ≤13 tagů/materiálů,
   * ≤5 odrážek, search terms ≤240). Sdílí analyze i refine, ať se nerozejdou.
   */
  private parseOptimizationResponse(rawText: string, platform: Platform) {
    let parsed: any;
    try {
      const raw = rawText.trim();
      const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(jsonText);
    } catch {
      throw new BadRequestException('AI vrátila neplatný formát odpovědi');
    }

    const tagLimited = platform === 'etsy';
    const tags: string[] = (Array.isArray(parsed.tags) ? parsed.tags : parsed.keywords || [])
      .map((t: unknown) => String(t).trim())
      .filter(Boolean)
      .map((t: string) => (tagLimited ? t.slice(0, 20) : t))
      .slice(0, 13);

    const materials: string[] = (Array.isArray(parsed.materials) ? parsed.materials : [])
      .map((m: unknown) => String(m).trim())
      .filter(Boolean)
      .slice(0, 13);

    const bulletPoints: string[] = (Array.isArray(parsed.bullet_points) ? parsed.bullet_points : [])
      .map((b: unknown) => String(b).trim())
      .filter(Boolean)
      .slice(0, 5);

    const searchTerms: string =
      typeof parsed.search_terms === 'string' ? parsed.search_terms.trim().slice(0, 240) : '';

    const platformFields: {
      materials?: string[];
      bulletPoints?: string[];
      searchTerms?: string;
    } = {};
    if (materials.length) platformFields.materials = materials;
    if (bulletPoints.length) platformFields.bulletPoints = bulletPoints;
    if (searchTerms) platformFields.searchTerms = searchTerms;

    return { parsed, tags, platformFields };
  }

  /**
   * Doladění existující optimalizace podle instrukce uživatele. AI zachová, co
   * sedí, a změní jen požadované. Počítá se do kvóty jako analýza (je to další
   * volání Claude). Skóre/konkurence se nepřepočítává — refine je o textu.
   */
  async refine(
    productId: string,
    user: User,
    platform: Platform,
    lang: 'cs' | 'en',
    instruction: string,
  ) {
    const lockKey = `${user.id}:${productId}:${platform}:refine`;
    if (!this.analyzeLock.acquire(lockKey)) {
      throw new ConflictException(
        'Úprava tohoto produktu právě probíhá. Počkejte prosím na výsledek.',
      );
    }
    try {
      return await this.performRefine(productId, user, platform, lang, instruction);
    } finally {
      this.analyzeLock.release(lockKey);
    }
  }

  private async performRefine(
    productId: string,
    user: User,
    platform: Platform,
    lang: 'cs' | 'en',
    instruction: string,
  ) {
    const limit = PLAN_LIMITS[user.plan];
    const now = new Date();
    const needsReset =
      !user.aiUsageResetAt ||
      user.aiUsageResetAt.getMonth() !== now.getMonth() ||
      user.aiUsageResetAt.getFullYear() !== now.getFullYear();
    const currentUsage = needsReset ? 0 : user.aiUsageThisMonth;
    if (!isVipActive(user) && currentUsage >= limit) {
      throw new BadRequestException(
        `Dosáhli jste měsíčního limitu ${limit} optimalizací pro váš tarif. Upgradujte plán pro více optimalizací.`,
      );
    }

    // Vlastnictví ověřeno v dotazu (IDOR) — upravit jde jen vlastní produkt.
    const product = await this.productRepo.findOne({
      where: { id: productId, maker: { userId: user.id } },
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');

    const opt = await this.optimizationRepo.findOne({
      where: { productId, platform },
      order: { createdAt: 'DESC' },
    });
    if (!opt) {
      throw new BadRequestException(
        'Pro tuto platformu zatím není optimalizace — nejdřív spusťte analýzu.',
      );
    }

    const trimmed = instruction.trim().slice(0, 1000);
    if (!trimmed) throw new BadRequestException('Napište, co chcete upravit.');

    const wantCzech = lang === 'cs' && platform !== 'fler';
    const platformSchema =
      platform === 'amazon'
        ? `  "bullet_points": ["exactly 5 concise benefit bullets, each max ~200 chars"],\n  "search_terms": "space-separated backend keywords, no commas, max 240 chars",`
        : platform === 'fler'
          ? `  "tags": ["až 13 českých štítků, každý max 20 znaků, malými písmeny"],\n  "materials": ["až 13 materiálů česky"],`
          : `  "tags": ["exactly 13 Etsy tags in English, each max 20 chars, lowercase"],\n  "materials": ["up to 13 materials in English"],`;

    const current = {
      optimized_title: opt.titleOptimized,
      optimized_description: opt.descriptionOptimized,
      tags: opt.keywords,
      materials: opt.platformFields?.materials,
      bullet_points: opt.platformFields?.bulletPoints,
      search_terms: opt.platformFields?.searchTerms,
      pricing_recommendation: opt.pricingRecommendation,
    };

    const promptText = `You are refining an EXISTING optimized handmade listing. Keep everything that already works and change ONLY what the user asks — do not rewrite unrelated parts.

Original product:
- Title: ${product.titleOriginal}
- Description: ${product.descriptionOriginal}
- Category: ${product.category || 'not specified'}

Current optimized listing:
${JSON.stringify(current, null, 2)}

User's requested change (follow it precisely): "${trimmed}"

Respond ONLY with a valid JSON object (no markdown, no explanation) in EXACTLY this structure:
{
  "optimized_title": "...",
  "title_czech": "${wantCzech ? 'Český překlad názvu' : ''}",
  "optimized_description": "...",
  "description_czech": "${wantCzech ? 'Český překlad popisu, stejná délka' : ''}",
${platformSchema}
  "pricing_recommendation": "...",
  "pricing_recommendation_czech": "${wantCzech ? 'Český překlad' : ''}",
  "competitiveness_score": ${opt.competitivenessScore}
}`;

    let message: Anthropic.Message;
    try {
      message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: promptText }],
      });
    } catch (err) {
      throw this.translateAnthropicError(err);
    }

    const content = message.content[0];
    if (content.type !== 'text') throw new BadRequestException('Neočekávaná odpověď AI');

    const { parsed, tags, platformFields } = this.parseOptimizationResponse(
      content.text,
      platform,
    );

    // Přepíšeme existující optimalizaci. Skóre, scoreSource i marketConclusion
    // necháváme být — refine mění text, ne tržní data (ta by znamenala nový dotaz na Etsy).
    opt.titleOptimized = parsed.optimized_title ?? opt.titleOptimized;
    opt.titleCzech = parsed.title_czech || opt.titleCzech;
    opt.descriptionOptimized = parsed.optimized_description ?? opt.descriptionOptimized;
    opt.descriptionCzech = parsed.description_czech || opt.descriptionCzech;
    opt.keywords = tags.length ? tags : opt.keywords;
    opt.platformFields = Object.keys(platformFields).length ? platformFields : opt.platformFields;
    opt.pricingRecommendation = parsed.pricing_recommendation ?? opt.pricingRecommendation;
    opt.pricingRecommendationCzech =
      parsed.pricing_recommendation_czech || opt.pricingRecommendationCzech;
    await this.optimizationRepo.save(opt);

    return { optimization: opt, needsReset, newUsage: currentUsage + 1 };
  }

  async getOptimizations(productId: string, user: User) {
    // Ověření vlastnictví v dotazu (IDOR): optimalizace vrátíme jen k produktu
    // přihlášeného uživatele. Cizí i neexistující → 404. Zásada 15.3.
    const product = await this.productRepo.findOne({
      where: { id: productId, maker: { userId: user.id } },
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');
    return this.optimizationRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
