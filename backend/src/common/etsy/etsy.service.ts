import { Injectable, Logger } from '@nestjs/common';

/** Snímek konkurence pro daná klíčová slova. */
export interface CompetitionSnapshot {
  competitorCount: number;
  priceMin: number;
  priceMedian: number;
  priceMax: number;
  priceCurrency: string;
  /** Nejčastější tagy konkurence, seřazené sestupně. */
  topTags: string[];
}

/**
 * Komunikace s Etsy Open API v3. Veškerá znalost Etsy je schválně jen tady —
 * zbytek aplikace pracuje s neutrálním `CompetitionSnapshot`.
 *
 * Bez `ETSY_API_KEY` (nebo při jakékoliv chybě) vrací `null` a volající se
 * plynule vrátí k odhadu AI. Konkurenční data jsou bonus, ne blokující závislost.
 *
 * POZN. pro nasazení: až bude klíč v .env, ověřte proti reálnému API tvar
 * odpovědi (endpoint `/listings/active`, cena jako {amount, divisor}) — Etsy
 * v minulosti měnilo dostupnost vyhledávacích endpointů. Vše je v této jedné
 * metodě, takže případná úprava je lokální.
 */
@Injectable()
export class EtsyService {
  private readonly logger = new Logger(EtsyService.name);
  private readonly apiKey = process.env.ETSY_API_KEY;
  private readonly baseUrl = 'https://openapi.etsy.com/v3/application';

  /** Je integrace nakonfigurovaná? Když ne, ani se nepokoušíme volat. */
  isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Vyhledá aktivní konkurenční listingy pro dotaz a vrátí agregovaný snímek.
   * Nikdy nevyhazuje výjimku — při problému loguje a vrací `null`.
   */
  async searchCompetition(query: string): Promise<CompetitionSnapshot | null> {
    if (!this.apiKey || !query.trim()) return null;

    const url =
      `${this.baseUrl}/listings/active` +
      `?keywords=${encodeURIComponent(query)}` +
      `&limit=100&sort_on=score`;

    try {
      const res = await fetch(url, {
        headers: { 'x-api-key': this.apiKey },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        this.logger.warn(`Etsy API vrátilo ${res.status} pro dotaz „${query}"`);
        return null;
      }

      const data: any = await res.json();
      const results: any[] = Array.isArray(data?.results) ? data.results : [];
      if (!results.length) {
        // Žádná konkurence nalezena — validní stav (nika), vrátíme prázdný snímek.
        return {
          competitorCount: typeof data?.count === 'number' ? data.count : 0,
          priceMin: 0,
          priceMedian: 0,
          priceMax: 0,
          priceCurrency: '',
          topTags: [],
        };
      }

      const prices = results
        .map((r) => this.parsePrice(r?.price))
        .filter((p): p is number => p !== null)
        .sort((a, b) => a - b);

      return {
        competitorCount:
          typeof data?.count === 'number' ? data.count : results.length,
        priceMin: prices[0] ?? 0,
        priceMedian: this.median(prices),
        priceMax: prices[prices.length - 1] ?? 0,
        priceCurrency: this.parsePrice(results[0]?.price, true) as string,
        topTags: this.topTags(results),
      };
    } catch (err) {
      this.logger.warn(
        `Etsy API selhalo pro dotaz „${query}": ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  /** Etsy v3 vrací cenu jako {amount, divisor, currency_code}; reálná = amount/divisor. */
  private parsePrice(
    price: any,
    wantCurrency = false,
  ): number | string | null {
    if (wantCurrency) return price?.currency_code ?? '';
    const amount = Number(price?.amount);
    const divisor = Number(price?.divisor);
    if (!Number.isFinite(amount) || !Number.isFinite(divisor) || divisor === 0) {
      return null;
    }
    return amount / divisor;
  }

  private median(sorted: number[]): number {
    if (!sorted.length) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /** Nejčastější tagy napříč výsledky (max 15). */
  private topTags(results: any[]): string[] {
    const counts = new Map<string, number>();
    for (const r of results) {
      const tags: string[] = Array.isArray(r?.tags) ? r.tags : [];
      for (const raw of tags) {
        const tag = String(raw).trim().toLowerCase();
        if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }
}
