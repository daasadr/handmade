# Tasks — marketplace showcase

## Backend (základ) — HOTOVO
- [x] Migrace: `isPublic` boolean default false na `maker_profiles` (+ entita).
- [x] `isPublic` do Create/Update DTO (`@IsBoolean @IsOptional`).
- [x] `PublicModule` + `PublicController` (bez JwtAuthGuard) + `PublicService`:
  - [x] `GET /public/makers` — seznam zveřejněných tvůrců (jen bezpečná pole, allowlist).
  - [x] `GET /public/makers/:id` — detail tvůrce + jeho hotové produkty; neveřejný → 404.
- [x] typecheck + testy zelené (16).

## Frontend (výloha) — HOTOVO (kromě metadat per-page)
- [x] Přepínač „Zobrazit ve veřejném adresáři" v editaci profilu (isPublic).
- [x] Sdílená komponenta `MakerStory` (blocks + sanitizované custom HTML) — na veřejném profilu.
- [x] `/vyrobci` — adresář zveřejněných tvůrců (karty: foto, jméno, motto).
- [x] `/vyrobci/[id]` — veřejný profil-příběh + produkty + tlačítka „Koupit na …".
- [x] Odkaz na výlohu z patičky landingu + veřejné hlavičky.
- [x] `/vyrobci` do sitemap.
- [ ] Metadata per-page veřejných stránek (klientské stránky — chce server komponenty; follow-up).

## Affiliate / kliky
- [ ] Tlačítka „Koupit" vedou na marketplaceLinks (u Etsy deep-link dle etsyListingId), klik se počítá.

## Review
- [ ] Review bezpečnosti: veřejné endpointy nevrací nic citlivého (allowlist), neveřejní tvůrci neviditelní.
