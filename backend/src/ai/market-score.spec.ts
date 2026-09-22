import { computeMarketScore, buildMarketConclusion } from './market-score';
import { CompetitionSnapshot } from '../common/etsy/etsy.service';

/**
 * Testy rozhodovací logiky skóre konkurenceschopnosti. Čisté funkce bez DB
 * a bez volání AI — přesně ta místa, kde se dělají chyby (bod 07 příručky).
 * Názvy testů popisují, co se hlídá, ne „že to funguje".
 */

const snapshot = (over: Partial<CompetitionSnapshot> = {}): CompetitionSnapshot => ({
  competitorCount: 500,
  priceMin: 100,
  priceMedian: 300,
  priceMax: 600,
  priceCurrency: 'CZK',
  topTags: ['ceramic', 'mug', 'handmade'],
  ...over,
});

describe('computeMarketScore', () => {
  it('drží výsledek vždy v rozsahu 0–100', () => {
    const score = computeMarketScore(300, ['ceramic', 'mug'], snapshot());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  // Chybějící data nesmí skóre srazit na 0 — dostávají neutrální díl.
  it('nespadne na nulu, když chybí cena i klíčová slova', () => {
    const score = computeMarketScore(undefined, [], snapshot({ topTags: [] }));
    // neutrál: cena 20 + saturace 18 (500 konkurentů, pásmo <2000) + slova 15 = 53
    expect(score).toBe(53);
  });

  // Cena pod mediánem je nejlepší cenová pozice → vyšší skóre než nad maximem.
  it('odmění cenu pod mediánem víc než cenu nad celým trhem', () => {
    const cheap = computeMarketScore(200, [], snapshot());
    const pricey = computeMarketScore(1000, [], snapshot());
    expect(cheap).toBeGreaterThan(pricey);
  });

  // Méně konkurentů = snazší viditelnost = vyšší skóre.
  it('dá vyšší skóre méně nasycenému trhu', () => {
    const niche = computeMarketScore(300, [], snapshot({ competitorCount: 50 }));
    const crowded = computeMarketScore(300, [], snapshot({ competitorCount: 20000 }));
    expect(niche).toBeGreaterThan(crowded);
  });

  // Shoda klíčových slov s tagy konkurence zvedá relevanci.
  it('odmění překryv klíčových slov s tagy konkurence', () => {
    const relevant = computeMarketScore(300, ['ceramic', 'mug'], snapshot());
    const irrelevant = computeMarketScore(300, ['xyz', 'qwe'], snapshot());
    expect(relevant).toBeGreaterThan(irrelevant);
  });

  // Porovnání je case-insensitive a nesmí ho rozhodit mezera navíc.
  it('sHoduje klíčová slova bez ohledu na velikost písmen a mezery', () => {
    const withCaseNoise = computeMarketScore(300, [' Ceramic ', 'MUG'], snapshot());
    const exact = computeMarketScore(300, ['ceramic', 'mug'], snapshot());
    expect(withCaseNoise).toBe(exact);
  });
});

describe('buildMarketConclusion', () => {
  // Prázdný trh má vlastní hlášku o nice, ne matoucí „0 konkurentů".
  it('u nulové konkurence mluví o nevyužité nice', () => {
    const text = buildMarketConclusion(300, ['ceramic'], snapshot({ competitorCount: 0 }));
    expect(text).toMatch(/nika|niku/i);
  });

  it('při ceně pod mediánem označí cenu za konkurenceschopnou', () => {
    const text = buildMarketConclusion(200, [], snapshot());
    expect(text).toMatch(/konkurenceschopná/i);
  });

  it('při ceně nad celým trhem varuje, že ji obhájí kvalita', () => {
    const text = buildMarketConclusion(1000, [], snapshot());
    expect(text).toMatch(/nad celým rozpětím/i);
  });

  // Závěr je deterministický — žádné volání AI, žádná náhoda (bod 08: model se musí umlčet).
  it('je deterministický — stejný vstup dá stejný text', () => {
    const a = buildMarketConclusion(300, ['ceramic', 'mug'], snapshot());
    const b = buildMarketConclusion(300, ['ceramic', 'mug'], snapshot());
    expect(a).toBe(b);
  });
});
