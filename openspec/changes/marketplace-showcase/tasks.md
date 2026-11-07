# Tasks — marketplace showcase

## Backend (základ) — HOTOVO
- [x] Migrace: `isPublic` boolean default false na `maker_profiles` (+ entita).
- [x] `isPublic` do Create/Update DTO (`@IsBoolean @IsOptional`).
- [x] `PublicModule` + `PublicController` (bez JwtAuthGuard) + `PublicService`:
  - [x] `GET /public/makers` — seznam zveřejněných tvůrců (jen bezpečná pole, allowlist).
  - [x] `GET /public/makers/:id` — detail tvůrce + jeho hotové produkty; neveřejný → 404.
- [x] typecheck + testy zelené (16).

## Frontend (výloha)
- [ ] Přepínač „Zobrazit ve veřejném adresáři" v editaci profilu (isPublic).
- [ ] Sdílená komponenta pro zobrazení příběhu (blocks + sanitizované custom HTML) — použít na profilu i veřejně.
- [ ] `/vyrobci` — adresář zveřejněných tvůrců (karty: foto, jméno, motto).
- [ ] `/vyrobci/[id]` — veřejný profil-příběh + produkty + tlačítka „Koupit na …".
- [ ] Odkaz na výlohu z navigace / patičky landingu.
- [ ] SEO: `/vyrobci` do sitemap, metadata veřejných stránek.

## Affiliate / kliky
- [ ] Tlačítka „Koupit" vedou na marketplaceLinks (u Etsy deep-link dle etsyListingId), klik se počítá.

## Review
- [ ] Review bezpečnosti: veřejné endpointy nevrací nic citlivého (allowlist), neveřejní tvůrci neviditelní.
