import { buildDraftListingPayload } from './etsy-listing.service';

/**
 * Testujeme rozhodnutí mapování (CLAUDE.md 15.7): tvrdé limity Etsy (title 140,
 * 13 tagů po 20 znacích) a bezpečné defaulty, ať koncept nespadne na validaci.
 */
describe('buildDraftListingPayload', () => {
  const baseProduct = { titleOriginal: 'Original', priceOriginal: 25 };
  const baseOpt = {
    titleOptimized: 'Optimized title',
    descriptionOptimized: 'A nice description',
    keywords: ['tag1', 'tag2'],
    platformFields: { materials: ['wool', 'cotton'] },
  };

  it('ořízne title na 140 znaků (tvrdý limit Etsy)', () => {
    const long = 'x'.repeat(200);
    const p = buildDraftListingPayload(baseProduct, { ...baseOpt, titleOptimized: long });
    expect(p.title.length).toBe(140);
  });

  it('omezí na 13 tagů a každý na 20 znaků', () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag-${i}-${'y'.repeat(30)}`);
    const p = buildDraftListingPayload(baseProduct, { ...baseOpt, keywords: many });
    expect(p.tags.length).toBe(13);
    expect(p.tags.every((t) => t.length <= 20)).toBe(true);
  });

  it('prázdné/mezerové tagy vyhodí', () => {
    const p = buildDraftListingPayload(baseProduct, { ...baseOpt, keywords: ['', '  ', 'ok'] });
    expect(p.tags).toEqual(['ok']);
  });

  it('chybějící cena spadne na 1, ne na 0 (Etsy chce kladné číslo)', () => {
    const p = buildDraftListingPayload({ titleOriginal: 'X', priceOriginal: undefined as any }, baseOpt);
    expect(p.price).toBe(1);
  });

  it('nastaví bezpečné povinné defaulty', () => {
    const p = buildDraftListingPayload(baseProduct, baseOpt);
    expect(p.quantity).toBe(1);
    expect(p.who_made).toBe('i_did');
    expect(p.when_made).toBe('made_to_order');
    expect(p.type).toBe('physical');
    expect(p.is_supply).toBe(false);
    expect(p.taxonomy_id).toBeGreaterThan(0);
  });

  it('použije originální název, když chybí optimalizovaný', () => {
    const p = buildDraftListingPayload(baseProduct, { ...baseOpt, titleOptimized: '' });
    expect(p.title).toBe('Original');
  });
});
