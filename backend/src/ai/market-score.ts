import { CompetitionSnapshot } from '../common/etsy/etsy.service';

/**
 * Skóre konkurenceschopnosti (0–100) spočítané z REÁLNÝCH dat konkurence,
 * ne z odhadu AI. Heuristika — vážený součet tří signálů:
 *
 *  1. Cenová pozice (0–40): sedí cena produktu do trhu? Cena ≤ medián je
 *     konkurenceschopná; výrazně nad maximem trhu se penalizuje.
 *  2. Nasycenost trhu (0–30): méně konkurentů = snazší se prosadit.
 *  3. Relevance klíčových slov (0–30): kolik AI klíčových slov se shoduje
 *     s tagy konkurence = jak trhově relevantní SEO to je.
 *
 * Chybějící data (např. produkt bez ceny) dostanou neutrální díl, aby skóre
 * zůstalo v rozsahu 0–100 a nebylo zavádějící.
 */
export function computeMarketScore(
  productPrice: number | undefined,
  keywords: string[],
  snapshot: CompetitionSnapshot,
): number {
  const priceScore = scorePrice(productPrice, snapshot);
  const saturationScore = scoreSaturation(snapshot.competitorCount);
  const keywordScore = scoreKeywords(keywords, snapshot.topTags);

  const total = priceScore + saturationScore + keywordScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}

/** 0–40; 20 (neutrál), když nejde posoudit. */
function scorePrice(price: number | undefined, s: CompetitionSnapshot): number {
  if (!price || !s.priceMedian) return 20;
  if (price <= s.priceMedian) return 40; // konkurenceschopná / atraktivní cena
  if (price <= s.priceMax) return 30; // v rozpětí trhu, ale nad mediánem
  return 15; // nad celým trhem — hůř se prodává
}

/** 0–30; méně konkurentů = vyšší skóre (snazší viditelnost). */
function scoreSaturation(count: number): number {
  if (count <= 0) return 15; // žádná data / úplná nika — neutrál
  if (count < 100) return 30;
  if (count < 500) return 24;
  if (count < 2000) return 18;
  if (count < 10000) return 12;
  return 6;
}

/** 0–30; podíl AI klíčových slov, která se objevují v tazích konkurence. */
function scoreKeywords(keywords: string[], topTags: string[]): number {
  if (!keywords.length || !topTags.length) return 15; // neutrál bez dat
  const tagSet = new Set(topTags.map((t) => t.toLowerCase()));
  const hits = keywords.filter((k) => tagSet.has(k.trim().toLowerCase())).length;
  return Math.round((hits / keywords.length) * 30);
}
