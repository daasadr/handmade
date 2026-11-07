# Design — marketplace showcase

## Context

Máme: `MakerProfile` (brandName, motto, story*, profileImageUrl, videoUrl, marketplaceLinks),
`Product` (titleOriginal, images, optimizations, category, priceOriginal, etsyListingId, status),
affiliate modul (odkazy + počítání kliků), SEO (sitemap/robots/JSON-LD). Chráněné API je celé
za `JwtAuthGuard`.

## Decisions

- **Opt-in `isPublic` (boolean, default false)** na `MakerProfile`. Veřejné se zobrazí jen
  tvůrci, kteří to zapnou. Migrace + přepínač na profilu + v DTO.
- **Samostatný `PublicModule`/`PublicController` BEZ JwtAuthGuard** pod prefixem `/public`.
  Nepřihlášené čtení. Vlastní DTO odpovědi (allowlist polí) — nikdy nevracet `User`, e-mail,
  kvótu, interní stav. (Zásada 15.3: za hranicí nevěř ničemu; tady navíc ven jen bezpečná data.)
- **Co se ukazuje u produktu:** optimalizovaný název (když existuje, jinak původní), první
  obrázek, kategorie, cena, a odkaz „Koupit". Produkty bez obrázku nebo ve stavu `draft`
  se ve výloze nezobrazí (ukazujeme jen hotové).
- **Odkaz „Koupit":** primárně `marketplaceLinks` tvůrce; u Etsy, když má produkt
  `etsyListingId`, deep-link na konkrétní listing. Klik přes affiliate endpoint (počítání).
- **Žádné surové Etsy konkurenční data** na veřejných stránkách (Etsy Terms) — ukazujeme
  jen obsah tvůrce.
- **Frontend**: veřejné routy mimo `(app)` group (bez JWT). Zobrazení příběhu (buildStoryBlocks
  + sanitizované custom HTML) vytáhnout do sdílené komponenty a použít na veřejném profilu.
- **SEO**: `/vyrobci` a profily do sitemap; metadata per stránka (server komponenta).

## Risks

- Soukromí: veřejný profil zobrazuje příběh a produkty. Kryje opt-in + allowlist polí.
- Produkt může mít citlivý/nevhodný obsah → do budoucna moderace (mimo tuto fázi, poznámka).
- i18n veřejných stránek: zatím klientské (CS first), stejné omezení jako zbytek webu.

## Odchylky při implementaci

(doplní se během stavby)
