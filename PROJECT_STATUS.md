# Handmade.net — Stav projektu & Kontext pro nový chat
*Aktualizováno: 2026-04-15*

---

## 1. Co je Handmade.net

**SaaS platforma (Launchpad model)** pro handmade výrobce.

Klíčový flow: výrobce nahraje produkt → AI (Claude) vygeneruje optimalizovaný název, popis, klíčová slova, cenové doporučení → výrobce použije výstup na Etsy nebo Amazon Handmade.

Platforma **NEPRODÁVÁ** produkty — je to optimalizační nástroj. Výrobce prodává sám na svých marketplace účtech.

---

## 2. Tech Stack

| Vrstva | Technologie | Verze |
|--------|------------|-------|
| Backend | NestJS (REST API) | 11.x |
| Frontend | Next.js (React) | 16.2.3 |
| Databáze | PostgreSQL | 16 |
| AI | Anthropic API (Claude Haiku 4.5) | claude-haiku-4-5-20251001 |
| Storage | Hetzner Object Storage (S3-compatible) | — |
| Auth | JWT (passport-jwt) | — |
| Queue | BullMQ / Bull | připraveno v deps |
| Hosting | Hetzner Cloud VPS (Docker + Nginx) | — |
| Platby | Stripe | fáze 2, NENÍ implementováno |

**Důležité:** AI model byl změněn z GPT-4o-mini (OpenAI) na **Claude Haiku 4.5 (Anthropic)**. Env var je `ANTHROPIC_API_KEY`, ne `OPENAI_API_KEY`.

---

## 3. Infrastruktura

- **Server:** Hetzner Cloud CX22, Ubuntu 22.04, IP: `46.224.46.43`
- **Docker:** nainstalován (verze 29.3.1)
- **Nginx:** nainstalován jako reverse proxy
  - `/` → frontend (port 3000)
  - `/api` → backend (port 3001)
- **Object Storage:** bucket `handmade-media` na Hetzner FSN1
- **Firewall:** povoleny porty 22, 80, 443
- **Doména:** `handmade.net` (registrátor: weby.cz — DNS zatím nepřesměrováno na server)
- **Backups:** zapnuty na Hetzner

---

## 4. Struktura projektu

```
handmade/
├── backend/                   # NestJS aplikace (port 3001)
│   ├── src/
│   │   ├── auth/              # Registrace, login, JWT, email verify, reset hesla
│   │   ├── users/             # User entita (role, plán, AI kvóta)
│   │   ├── makers/            # Maker profil CRUD
│   │   ├── products/          # Produkt CRUD
│   │   ├── ai/                # Anthropic API integrace
│   │   ├── affiliate/         # Affiliate links entita (modul NENÍ v app.module.ts)
│   │   └── common/            # Guards, decorators
│   └── package.json
├── frontend/                  # Next.js aplikace (port 3000)
│   └── app/
│       └── page.tsx           # POUZE placeholder (výchozí Next.js stránka)
├── docker-compose.yml
├── .env.example
├── HANDMADE_NET_SPEC.md       # Původní specifikace projektu
└── PROJECT_STATUS.md          # Tento dokument
```

---

## 5. Co je implementováno (backend)

### 5.1 Databázové entity (TypeORM, auto-synchronize v dev)

**`users`** — kompletní entita:
- UUID PK, email (unique), passwordHash, role (admin/maker), plan (free/mini/midi/max)
- isFoundingMember, emailVerified
- emailVerificationToken, passwordResetToken, passwordResetExpires
- aiUsageThisMonth (int), aiUsageResetAt (timestamp) — pro měsíční kvótu
- Relation: OneToOne → MakerProfile

**`maker_profiles`** — kompletní entita:
- UUID PK, userId (FK), brandName, bio, profileImageUrl, videoUrl
- marketplaceLinks (JSONB), products (OneToMany → Product)

**`products`** — kompletní entita:
- UUID PK, makerId (FK), titleOriginal, descriptionOriginal
- priceOriginal (decimal), category, status (draft/analyzed/completed)
- etsyListingId (pro budoucí Etsy OAuth integraci)
- images (OneToMany → ProductImage), optimizations (OneToMany → AiOptimization)

**`product_images`** — entita (soubor existuje, v app.module.ts registrována):
- UUID PK, productId (FK), imageUrl, orderIndex

**`ai_optimizations`** — kompletní entita:
- UUID PK, productId (FK), titleOptimized, descriptionOptimized
- keywords (JSONB array), pricingRecommendation, competitivenessScore (int)
- aiModelUsed, platform ('etsy' | 'amazon'), createdAt

**`affiliate_links`** — entita existuje (soubor: `src/affiliate/affiliate-link.entity.ts`):
- UUID PK, title, url, description, clickCount
- **POZOR:** AffiliateModule není implementován, entita je jen v app.module.ts

### 5.2 Auth modul — kompletní

Endpointy (prefix `/api/auth/`):
- `POST /register` — hash hesla (bcrypt 12 kol), generuje emailVerificationToken, loguje token do konzole (TODO: odeslat email)
- `POST /login` — vrací JWT token + user info (včetně plánu)
- `POST /verify-email?token=xxx` — ověří token, nastaví emailVerified=true
- `POST /forgot-password` — generuje passwordResetToken (platný 1h), loguje do konzole
- `POST /reset-password` — ověří token, nastaví nové heslo
- `GET /me` — vrací aktuálního přihlášeného uživatele (vyžaduje JWT)

**JWT:** passport-jwt strategie, JwtAuthGuard, CurrentUser decorator

### 5.3 Makers modul — kompletní

Endpointy (prefix `/api/makers/`):
- `GET /profile` — zobrazí profil přihlášeného uživatele
- `POST /profile` — vytvoří maker profil (brandName povinné)
- `PATCH /profile` — upraví profil

**Chybí:** upload profilové fotky na S3, video embed

### 5.4 Products modul — kompletní (bez upload)

Endpointy (prefix `/api/products/`):
- `GET /` — seznam produktů přihlášeného makera (s images + optimizations)
- `GET /:id` — detail produktu (s kontrolou vlastnictví)
- `POST /` — vytvoří produkt (vyžaduje existující maker profil)
- `PATCH /:id` — upraví produkt
- `DELETE /:id` — smaže produkt

**Chybí:** upload obrázků na S3 (`POST /:id/images`)

### 5.5 AI modul — kompletní

Endpointy (prefix `/api/ai/`):
- `POST /products/:id/analyze?platform=etsy|amazon` — spustí AI analýzu
- `GET /products/:id/optimizations` — vrátí historii optimalizací

**AI workflow:**
1. Zkontroluje měsíční kvótu uživatele (dle tarifu)
2. Pokud je nový měsíc → resetuje čítač (aiUsageResetAt)
3. Zavolá Claude Haiku 4.5 s product info + platform-specific promptem
4. Parsuje JSON odpověď
5. Uloží do ai_optimizations
6. Aktualizuje products.status na 'analyzed'
7. Vrátí výsledek

**Tarify (měsíční limity AI optimalizací):**
- FREE: 5 / měsíc
- MINI: 30 / měsíc
- MIDI: 150 / měsíc
- MAX: 99 999 / měsíc (neomezeno)

**Platform-specific prompty:**
- Etsy: focus na handmade, authenticity, artisan qualities, Etsy SEO
- Amazon Handmade: focus na quality, materials, dimensions, Amazon search

---

## 6. Co je implementováno (frontend)

**Prakticky nic** — frontend je defaultní Next.js placeholder (`app/page.tsx` je výchozí stránka z create-next-app). Tailwind CSS je nainstalován, ale UI nebylo stavěno.

---

## 7. Co CHYBÍ (TODO)

### Kritické (bez toho platforma nefunguje):

#### Backend
- [ ] **Upload obrázků na S3** — endpoint `POST /api/products/:id/images` (multer + AWS SDK — deps jsou v package.json)
- [ ] **Upload profilové fotky** — endpoint `POST /api/makers/profile/image`
- [ ] **Email odesílání** — SMTP integrace pro verifikaci emailu a reset hesla (teď jen console.log)
- [ ] **Admin modul** — správa uživatelů, founding member flag, statistiky
- [ ] **Charity modul** — backend + endpointy
- [ ] **Affiliate modul** — AffiliateModule, controller, service (entita existuje)
- [ ] **Aktualizace aiUsageThisMonth v DB** — po AI analýze se čítač neukládá zpět do DB! (bug v ai.service.ts)
- [ ] **Etsy OAuth 2.0 integrace** — přímý push listingů na Etsy (schváleno pro implementaci)
- [ ] **Amazon export** — generování Amazon flat-file CSV ke stažení

#### Frontend (vše chybí)
- [ ] Landing page (marketing stránka)
- [ ] Registrace / Login stránky
- [ ] Dashboard (přehled produktů)
- [ ] Maker profil formulář
- [ ] Produkt formulář + upload fotek
- [ ] AI analýza stránka (before/after zobrazení)
- [ ] Charity stránka (public)
- [ ] Admin panel
- [ ] Správa tarifu / upgrade

### Důležité (před produkčním launchem):
- [ ] **Rate limiting** — helmet, throttler na API endpointy
- [ ] **Validation pipes** — class-validator na všechna DTO (teď chybí GlobalPipe)
- [ ] **CORS** — správná konfigurace pro produkci
- [ ] **Error handling** — globální exception filter
- [ ] **Logging** — strukturované logy (Winston nebo NestJS Logger)
- [ ] **Produkční Docker konfigurace** — multi-stage build, zdravotní kontroly
- [ ] **Nginx konfigurace** — SSL/TLS (Let's Encrypt), rate limiting
- [ ] **DNS přesměrování** — handmade.net → 46.224.46.43

### Fáze 2 (po launchi):
- [ ] **Stripe integrace** — předplatné (MINI/MIDI/MAX tarify)
- [ ] **Bulk import** — CSV feed + BullMQ fronta (deps jsou v package.json)
- [ ] **Komunita/fórum** — Sprint 4+
- [ ] **Founding Member feature flag** — přístup k exkluzivním features

---

## 8. Rozhodnutí z diskuzí (klíčové)

| Téma | Rozhodnutí |
|------|-----------|
| AI model | Claude Haiku 4.5 (Anthropic), NENÍ OpenAI |
| Rate limiting | MĚSÍČNÍ kvóta dle tarifu, NE hodinový limit |
| Tarify | FREE (5) / MINI (30) / MIDI (150) / MAX (∞) |
| Etsy integrace | Plná OAuth 2.0 — přímý push listingů |
| Amazon integrace | Export Amazon flat-file CSV (SP-API příliš omezené) |
| Bulk import | CSV feed + BullMQ fronta |
| Trial účet | ODMÍTNUTO — porušilo by ToS. Nahrazeno free tier (5 opt./měsíc) |
| Komunita/fórum | Plánováno do Sprint 4+ |
| Competitiveness score | V MVP heuristický (AI odhad), NEnapojený na živá data |

---

## 9. Env proměnné (.env.example)

```env
# Databáze
POSTGRES_PASSWORD=localdev
DATABASE_URL=postgresql://handmade:localdev@postgres:5432/handmade

# JWT
JWT_SECRET=min_32_znaku_nahodny_retezec
JWT_EXPIRES_IN=7d

# Anthropic AI (POZOR: ne OpenAI!)
ANTHROPIC_API_KEY=sk-ant-...

# Hetzner Object Storage (S3-compatible)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_BUCKET=handmade-media
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=eu-central

# Email (pro ověření emailu a reset hesla)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@handmade.net

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 10. Spuštění lokálně

```bash
# Z kořenové složky projektu
docker compose up

# Backend dostupný na: http://localhost:3001
# Frontend dostupný na: http://localhost:3000
# PostgreSQL dostupný na: localhost:5432
```

---

## 11. Známé bugy

### Bug #1 — AI usage counter se neukládá do DB
**Soubor:** `backend/src/ai/ai.service.ts`
**Problém:** Po úspěšné AI analýze se `aiUsageThisMonth` inkrementuje jen lokálně v paměti — nezapisuje se zpět do databáze. To znamená, že měsíční limity nefungují správně přes restarty.
**Oprava:** Po úložení optimization je třeba aktualizovat User entitu v DB.

### Bug #2 — MakersService.findById nepotřebný
**Soubor:** `backend/src/products/products.service.ts:26`
**Problém:** `getMakerProfile` volá `makersService.findById(user.id)` (hledá profil dle ID, ale předává userId), pak volá `makersService.getProfile(user)`. První volání je zbytečné.

---

## 12. Sprint plán (kde jsme)

### Sprint 1 — DOKONČENO
- [x] NestJS projekt se strukturou modulů
- [x] TypeORM + PostgreSQL entity a auto-migrace
- [x] Auth modul (register, login, JWT, email verify, reset hesla)
- [x] Next.js projekt (jen skeleton)
- [x] Docker Compose

### Sprint 2 — ČÁSTEČNĚ
- [x] Maker profil CRUD
- [x] Produkt CRUD
- [x] AI analýza (Claude Haiku 4.5) s měsíční kvótou
- [ ] Upload obrázků na S3
- [ ] Frontend UI

### Sprint 3 — NEZAČATO
- [ ] Email odesílání (SMTP)
- [ ] Admin panel
- [ ] Charity modul
- [ ] Founding Member systém

### Sprint 4 — NEZAČATO
- [ ] Error handling + logging
- [ ] Bezpečnostní audit
- [ ] Produkční Docker
- [ ] Testy

---

## 13. Kontakt a vlastnictví

- **Vlastník projektu:** Dagmar Drbálková
- **Komunikace:** česky
- **Kolega:** navrhoval feeds a bulk přístup (CSV import)
- **Git branch:** `master` (main větev: `main`)
