import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { AiOptimization } from '../ai/ai-optimization.entity';
import { User } from '../users/user.entity';
import { EtsyConnectService } from './etsy-connect.service';
import { EtsyOAuthService } from './etsy-oauth.service';
import { InFlightLock } from '../ai/in-flight-lock';

const APPLICATION_BASE = 'https://openapi.etsy.com/v3/application';

// Povinná Etsy pole, pro která nemáme vlastní zdroj. Výrobce je v konceptu
// upraví. Bezpečné defaulty pro handmade:
const DEFAULT_WHO_MADE = 'i_did'; // tvůrce = výrobce
const DEFAULT_WHEN_MADE = 'made_to_order'; // handmade bývá na zakázku
const DEFAULT_LISTING_TYPE = 'physical';

/**
 * `taxonomy_id` je u Etsy POVINNÉ číselné ID z jejich taxonomie, naše
 * `product.category` je volný text. Řešení: `resolveTaxonomyId()` vezme env
 * `ETSY_DEFAULT_TAXONOMY_ID`, jinak si samo najde platný listový uzel v taxonomii
 * Etsy. Tahle funkce je jen fallback pro čistý builder (volaný bez ID v testech).
 * Výrobce kategorii v konceptu stejně upraví.
 */
function defaultTaxonomyId(): number {
  const raw = Number(process.env.ETSY_DEFAULT_TAXONOMY_ID);
  return Number.isFinite(raw) && raw > 0 ? raw : 1; // fallback, běžně se nepoužije
}

export interface DraftListingPayload {
  quantity: number;
  title: string;
  description: string;
  price: number;
  who_made: string;
  when_made: string;
  taxonomy_id: number;
  type: string;
  is_supply: boolean;
  tags: string[];
  materials: string[];
  /** Povinné pro fyzický listing (Etsy docs). Načítá se z obchodu tvůrce. */
  shipping_profile_id?: number;
}

/**
 * Čisté mapování naší optimalizace na Etsy createDraftListing payload.
 * Vytaženo zvlášť, ať jde otestovat bez sítě a DB (CLAUDE.md 15.7).
 *
 * Ořezy jsou TVRDÉ limity Etsy: title ≤140 znaků, max 13 tagů (každý ≤20 znaků),
 * max 13 materiálů. Překročení by Etsy odmítlo s chybou.
 */
export function buildDraftListingPayload(
  product: Pick<Product, 'titleOriginal' | 'priceOriginal'>,
  opt: Pick<AiOptimization, 'titleOptimized' | 'descriptionOptimized' | 'keywords' | 'platformFields'>,
  taxonomyId: number = defaultTaxonomyId(),
  shippingProfileId?: number,
): DraftListingPayload {
  const materials = (opt.platformFields?.materials ?? [])
    .map((m) => String(m).trim())
    .filter(Boolean)
    .slice(0, 13);
  const tags = (opt.keywords ?? [])
    .map((t) => String(t).trim().slice(0, 20))
    .filter(Boolean)
    .slice(0, 13);

  // Cena: Etsy chce kladné číslo. Když chybí, dáme 1 (výrobce v konceptu opraví),
  // ať aspoň koncept vznikne a nespadne na validaci.
  const price =
    product.priceOriginal != null && Number(product.priceOriginal) > 0
      ? Number(product.priceOriginal)
      : 1;

  return {
    quantity: 1,
    title: (opt.titleOptimized || product.titleOriginal || '').slice(0, 140),
    description: opt.descriptionOptimized || '',
    price,
    who_made: DEFAULT_WHO_MADE,
    when_made: DEFAULT_WHEN_MADE,
    taxonomy_id: taxonomyId,
    type: DEFAULT_LISTING_TYPE,
    is_supply: false,
    tags,
    materials,
    shipping_profile_id: shippingProfileId,
  };
}

/** Serializace do form-urlencoded (Etsy createDraftListing očekává form, ne JSON).
 *  Pole (tags, materials) Etsy přijímá jako čárkou oddělený seznam. */
function toFormBody(p: DraftListingPayload): string {
  const params = new URLSearchParams();
  params.set('quantity', String(p.quantity));
  params.set('title', p.title);
  params.set('description', p.description);
  params.set('price', String(p.price));
  params.set('who_made', p.who_made);
  params.set('when_made', p.when_made);
  params.set('taxonomy_id', String(p.taxonomy_id));
  params.set('type', p.type);
  params.set('is_supply', String(p.is_supply));
  if (p.tags.length) params.set('tags', p.tags.join(','));
  if (p.materials.length) params.set('materials', p.materials.join(','));
  if (p.shipping_profile_id != null) {
    params.set('shipping_profile_id', String(p.shipping_profile_id));
  }
  return params.toString();
}

@Injectable()
export class EtsyListingService {
  private readonly logger = new Logger(EtsyListingService.name);
  private readonly pushLock = new InFlightLock();
  // Taxonomie je velká a stabilní — najdeme platné ID jednou a držíme v paměti.
  private cachedTaxonomyId?: number;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(AiOptimization)
    private readonly optimizationRepo: Repository<AiOptimization>,
    private readonly connect: EtsyConnectService,
    private readonly oauth: EtsyOAuthService,
  ) {}

  /**
   * Založí KONCEPT listingu v obchodě tvůrce a vrátí odkaz. Vlastnictví produktu
   * ověřeno V DOTAZU (IDOR, 404). Zámek proti dvojkliku jako u analyze (15.4).
   */
  async createDraft(
    user: User,
    productId: string,
  ): Promise<{ listingId: string; url: string }> {
    const lockKey = `${user.id}:${productId}:etsy-draft`;
    if (!this.pushLock.acquire(lockKey)) {
      throw new ConflictException(
        'Odesílání na Etsy právě probíhá. Počkejte prosím na výsledek.',
      );
    }
    try {
      // Vlastnictví ověřeno V DOTAZU (IDOR, 404) — poslat jde jen vlastní produkt.
      const product = await this.productRepo.findOne({
        where: { id: productId, maker: { userId: user.id } },
      });
      if (!product) throw new NotFoundException('Produkt nenalezen');

      // Nejnovější Etsy optimalizace produktu. Bez ní nemáme co poslat.
      const opt = await this.optimizationRepo.findOne({
        where: { productId, platform: 'etsy' },
        order: { createdAt: 'DESC' },
      });
      if (!opt) {
        throw new BadRequestException(
          'Nejdřív spusťte pro tento produkt Etsy analýzu.',
        );
      }

      const { accessToken, shopId } = await this.connect.getAccessContext(
        user.id,
      );

      // Fyzický listing u Etsy POVINNĚ potřebuje dopravní profil (docs). Vezmeme
      // první z obchodu tvůrce. Když žádný nemá, nemá cenu volat Etsy — poradíme.
      const shippingProfileId = await this.getFirstShippingProfileId(
        shopId,
        accessToken,
      );
      if (!shippingProfileId) {
        throw new BadRequestException(
          'Ve svém Etsy obchodě nemáš žádný dopravní profil. Vytvoř si ho v Etsy ' +
            '(Shop Manager → Settings → Shipping settings) a zkus to znovu.',
        );
      }
      // Platné taxonomy_id (povinné): z env, jinak si ho sami najdeme v taxonomii.
      const taxonomyId = await this.resolveTaxonomyId(accessToken);

      const payload = buildDraftListingPayload(
        product,
        opt,
        taxonomyId,
        shippingProfileId,
      );

      const res = await fetch(
        `${APPLICATION_BASE}/shops/${shopId}/listings`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.oauth.getClientId(),
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: toFormBody(payload),
          signal: AbortSignal.timeout(12000),
        },
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.warn(`createDraftListing vrátil ${res.status}: ${detail.slice(0, 500)}`);
        // Reálnou hlášku z Etsy ukážeme uživateli (je to jeho vlastní obchod) —
        // u živého testu hned vidíme, co Etsy případně ještě chce (např. readiness
        // state). Oříznuto, ať nevznikne obří toast.
        throw new ServiceUnavailableException(
          `Etsy odmítlo založení konceptu: ${this.etsyErrorText(detail)}`,
        );
      }

      const data: any = await res.json();
      const listingId = String(data?.listing_id ?? '');
      // Uložíme jen ID konceptu + příznak, že NENÍ zveřejněný (je to koncept).
      // Žádná další data z Etsy neukládáme (Etsy API Terms). Výloha „Koupit na
      // Etsy" se rozsvítí až po zveřejnění (syncListingState).
      if (listingId) {
        await this.productRepo.update(product.id, {
          etsyListingId: listingId,
          etsyListingActive: false,
        });
      }
      return {
        listingId,
        // Odkaz do editace konceptu v obchodě tvůrce.
        url: `https://www.etsy.com/your/shops/me/tools/listings/${listingId}`,
      };
    } finally {
      this.pushLock.release(lockKey);
    }
  }

  /**
   * Zjistí reálný stav Etsy listingu a překlopí `etsyListingActive`
   * (active = zveřejněno = veřejně koupitelné). Ukládáme jen ten odvozený
   * boolean, ne obsah listingu (Etsy API Terms). Volá se, když se tvůrce vrátí
   * do appky po zveřejnění konceptu na Etsy.
   */
  async syncListingState(
    user: User,
    productId: string,
  ): Promise<{ active: boolean }> {
    const product = await this.productRepo.findOne({
      where: { id: productId, maker: { userId: user.id } },
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');
    if (!product.etsyListingId) return { active: false };

    const { accessToken } = await this.connect.getAccessContext(user.id);
    const res = await fetch(
      `${APPLICATION_BASE}/listings/${product.etsyListingId}`,
      {
        headers: {
          'x-api-key': this.oauth.getClientId(),
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) {
      // Listing smazán / nedostupný → bereme jako nezveřejněný (nezobrazíme „Koupit").
      if (res.status === 404) {
        await this.productRepo.update(product.id, { etsyListingActive: false });
        return { active: false };
      }
      throw new ServiceUnavailableException(
        'Nepodařilo se ověřit stav listingu na Etsy. Zkuste to prosím znovu.',
      );
    }
    const data: any = await res.json();
    const active = data?.state === 'active';
    await this.productRepo.update(product.id, { etsyListingActive: active });
    return { active };
  }

  /** První dopravní profil obchodu (shipping_profile_id), nebo null. */
  private async getFirstShippingProfileId(
    shopId: string,
    accessToken: string,
  ): Promise<number | null> {
    try {
      const res = await fetch(
        `${APPLICATION_BASE}/shops/${shopId}/shipping-profiles`,
        {
          headers: {
            'x-api-key': this.oauth.getClientId(),
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok) return null;
      const data: any = await res.json();
      const id = data?.results?.[0]?.shipping_profile_id;
      return typeof id === 'number' ? id : null;
    } catch {
      return null;
    }
  }

  /**
   * Platné `taxonomy_id`: z env `ETSY_DEFAULT_TAXONOMY_ID`, jinak si najdeme první
   * LISTOVÝ uzel v taxonomii Etsy (bez potomků) — to je validní kategorie.
   * Výrobce ji v konceptu stejně upraví. Cachujeme, taxonomie se nemění.
   */
  private async resolveTaxonomyId(accessToken: string): Promise<number> {
    const env = Number(process.env.ETSY_DEFAULT_TAXONOMY_ID);
    if (Number.isFinite(env) && env > 0) return env;
    if (this.cachedTaxonomyId) return this.cachedTaxonomyId;

    try {
      const res = await fetch(`${APPLICATION_BASE}/seller-taxonomy/nodes`, {
        headers: {
          'x-api-key': this.oauth.getClientId(),
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const leaf = this.firstLeafId(data?.results ?? []);
        if (leaf) {
          this.cachedTaxonomyId = leaf;
          return leaf;
        }
      }
    } catch {
      /* spadneme na fallback níže */
    }
    // Poslední záchrana — ať koncept aspoň vznikne; kategorii výrobce opraví.
    return 1;
  }

  /** Najde první listový uzel (bez potomků) v taxonomickém stromu Etsy. */
  private firstLeafId(nodes: any[]): number | null {
    for (const n of nodes) {
      const children = Array.isArray(n?.children) ? n.children : [];
      if (children.length === 0 && typeof n?.id === 'number') return n.id;
      const deep = this.firstLeafId(children);
      if (deep) return deep;
    }
    return null;
  }

  /** Vytáhne čitelnou hlášku z chybové odpovědi Etsy (JSON `{error}` nebo text). */
  private etsyErrorText(raw: string): string {
    try {
      const j = JSON.parse(raw);
      return String(j?.error || j?.message || raw).slice(0, 200);
    } catch {
      return (raw || 'neznámá chyba').slice(0, 200);
    }
  }
}
