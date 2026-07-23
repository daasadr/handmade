import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
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
import { computeMarketScore } from './market-score';

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

  async analyze(productId: string, user: User, platform: 'etsy' | 'amazon' = 'etsy') {
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

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');

    const platformInstructions =
      platform === 'etsy'
        ? 'Etsy marketplace (focus on handmade, authentic, artisan qualities; use Etsy SEO best practices)'
        : 'Amazon Handmade (focus on quality, materials, dimensions; use Amazon search optimization)';

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

    const promptText = `You are an expert in optimizing product listings for handmade marketplaces.
${imageAnalysisInstruction}
Optimize this handmade product listing for ${platformInstructions}:
- Title: ${product.titleOriginal}
- Description: ${product.descriptionOriginal}
- Category: ${product.category || 'not specified'}
- Current Price: ${product.priceOriginal ? `${product.priceOriginal} EUR` : 'not specified'}

${hasImages ? 'Ground the optimized title and description in the specific visual details you observed in the photos. Mention specific colors, materials, and techniques you can actually see.' : ''}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "optimized_title": "SEO-optimized title in English, max 140 chars — include specific materials/colors/technique from the photo",
  "title_czech": "Český překlad optimalizovaného názvu",
  "optimized_description": "Vivid, specific description with SEO keywords in English, 150-300 words. Describe what makes this piece unique based on what is visible.",
  "description_czech": "Český překlad optimalizovaného popisu, stejná délka",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10", "keyword11", "keyword12", "keyword13"],
  "pricing_recommendation": "Brief pricing strategy advice in English, 2-3 sentences",
  "pricing_recommendation_czech": "Český překlad cenového doporučení",
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
        max_tokens: 1500,
        messages: [{ role: 'user', content: messageContent as any }],
      });
    } catch (err) {
      throw this.translateAnthropicError(err);
    }

    const content = message.content[0];
    if (content.type !== 'text') throw new BadRequestException('Neočekávaná odpověď AI');

    let parsed: any;
    try {
      // Claude někdy obalí JSON do markdown bloků — extrahujeme čistý JSON
      const raw = content.text.trim();
      const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(jsonText);
    } catch {
      throw new BadRequestException('AI vrátila neplatný formát odpovědi');
    }

    const keywords: string[] = parsed.keywords || [];

    // Reálná konkurence z Etsy — jen když je API nakonfigurováno a jde o Etsy.
    // Amazon nemá veřejné vyhledávací API (viz nápověda), takže tam zůstává odhad AI.
    // Selhání Etsy nesmí shodit analýzu — proto se skóre z AI použije jako fallback.
    let scoreSource: 'ai' | 'market' = 'ai';
    let competitivenessScore: number = parsed.competitiveness_score ?? 0;
    let competition: Awaited<ReturnType<EtsyService['searchCompetition']>> = null;

    if (platform === 'etsy' && this.etsyService.isEnabled()) {
      // Dotaz na trh = pár hlavních klíčových slov (co by zákazník opravdu hledal),
      // fallback na původní název, kdyby AI klíčová slova nevrátila.
      const query = keywords.slice(0, 3).join(' ') || product.titleOriginal;
      competition = await this.etsyService.searchCompetition(query);

      if (competition) {
        competitivenessScore = computeMarketScore(
          product.priceOriginal,
          keywords,
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
      keywords,
      pricingRecommendation: parsed.pricing_recommendation,
      pricingRecommendationCzech: parsed.pricing_recommendation_czech,
      competitivenessScore,
      scoreSource,
      // undefined → TypeORM uloží NULL; null neprojde přes DeepPartial<number>.
      competitorCount: competition?.competitorCount,
      priceMin: competition?.priceMin,
      priceMedian: competition?.priceMedian,
      priceMax: competition?.priceMax,
      priceCurrency: competition?.priceCurrency,
      competitorTags: competition?.topTags ?? [],
      aiModelUsed: 'claude-haiku-4-5',
      platform,
    });
    await this.optimizationRepo.save(optimization);

    await this.productRepo.update(productId, { status: ProductStatus.ANALYZED });

    return {
      optimization,
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

  async getOptimizations(productId: string) {
    return this.optimizationRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
