# CLAUDE.md — Handmade.net: Instrukce pro AI agenta

> Tento soubor je primární zdroj pravdy pro každého AI agenta pracujícího na tomto projektu.
> Přečti ho celý před jakoukoliv akcí. Zaznamenávej veškerou práci do `CHANGELOG.md`.

---

## 1. Co je Handmade.net

**SaaS platforma (Launchpad model)** pro handmade výrobce.

**Hlavní flow:** výrobce přidá produkt (název, popis, cena, kategorie) → klikne "Spustit analýzu" → Claude AI vygeneruje optimalizovaný název, popis, 13 klíčových slov a cenové doporučení zvlášť pro Etsy a Amazon Handmade → výrobce výsledek zkopíruje na svůj marketplace účet.

**Klíčové:** platforma **NEPRODÁVÁ** produkty. Je to optimalizační nástroj. Výrobce prodává sám.

---

## 2. Tech Stack

| Vrstva | Technologie | Verze |
|--------|------------|-------|
| Backend | NestJS (REST API) | 11.x |
| Frontend | Next.js App Router | 16.2.3 |
| UI komponenty | shadcn/ui (base-nova, @base-ui/react) | — |
| Styling | Tailwind CSS | 4.x |
| Databáze | PostgreSQL | 16 |
| ORM | TypeORM | 0.3.x |
| AI | Anthropic API — Claude Haiku 4.5 | claude-haiku-4-5-20251001 |
| Storage | Hetzner Object Storage (S3-compatible) | — |
| Queue | Bull/BullMQ | v deps, zatím nepoužito |
| Auth | JWT (passport-jwt) | — |
| Validace | class-validator + class-transformer | — |
| Hosting | Hetzner Cloud CX22, Ubuntu 22.04 | IP: 46.224.46.43 |
| Reverse proxy | Nginx | — |
| Kontejnery | Docker + Docker Compose | — |
| Platby | Stripe | fáze 2, NENÍ implementováno |

**DŮLEŽITÉ:** AI model je Anthropic (Claude), ne OpenAI. Env var: `ANTHROPIC_API_KEY`.

---

## 3. Struktura projektu

```
handmade/
├── backend/                          # NestJS (port 3001)
│   └── src/
│       ├── auth/                     # JWT auth, registrace, login, reset hesla
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── jwt.strategy.ts
│       │   └── dto/                  # login.dto, register.dto, reset-password.dto
│       ├── users/
│       │   └── user.entity.ts        # Role (admin/maker), Plan (free/mini/midi/max), AI kvóta
│       ├── makers/
│       │   ├── maker-profile.entity.ts
│       │   ├── makers.controller.ts
│       │   └── makers.service.ts     # CreateMakerProfileDto s class-validator dekorátory
│       ├── products/
│       │   ├── product.entity.ts     # Status: draft/analyzed/completed
│       │   ├── product-image.entity.ts
│       │   ├── products.controller.ts
│       │   └── products.service.ts   # CreateProductDto s class-validator dekorátory
│       ├── ai/
│       │   ├── ai-optimization.entity.ts
│       │   ├── ai.controller.ts      # Prefix: /api/products/:id/analyze
│       │   └── ai.service.ts         # Claude Haiku 4.5, měsíční kvóta, stripuje markdown z JSON
│       ├── affiliate/
│       │   └── affiliate-link.entity.ts  # Entita existuje, AffiliateModule NENÍ
│       └── common/
│           ├── decorators/           # CurrentUser, Roles
│           └── guards/               # JwtAuthGuard, RolesGuard
├── frontend/                         # Next.js (port 3000)
│   ├── app/
│   │   ├── page.tsx                  # Landing page (marketing)
│   │   ├── layout.tsx                # Root layout: Cormorant Garamond + DM Sans fonty
│   │   ├── globals.css               # Vlastní CSS proměnné, barevná paleta
│   │   ├── tarify/page.tsx           # Stránka tarifů (4 plány)
│   │   ├── (auth)/                   # Login, register — bez navigace
│   │   │   ├── layout.tsx            # Dekorativní pozadí s glow efekty
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (app)/                    # Chráněné stránky — vyžaduje JWT
│   │       ├── layout.tsx            # AuthProvider + redirect na /login
│   │       ├── dashboard/page.tsx    # Přehled produktů, kvóta, stats
│   │       ├── products/
│   │       │   ├── page.tsx          # Redirect na /dashboard
│   │       │   ├── new/page.tsx      # Formulář nového produktu
│   │       │   └── [id]/page.tsx     # Detail + AI analýza (before/after)
│   │       └── profile/page.tsx      # Maker profil + info o tarifu
│   ├── components/
│   │   ├── nav.tsx                   # Navigace pro přihlášené uživatele
│   │   └── ui/                       # shadcn/ui komponenty
│   └── lib/
│       ├── api.ts                    # Typovaný API klient (JWT v localStorage)
│       ├── auth-context.tsx          # AuthProvider, useAuth hook
│       └── utils.ts                  # cn() helper
├── docker-compose.yml                # Dev prostředí (s volumes)
├── docker-compose.prod.yml           # Produkce (build z Dockerfile)
├── .env.example                      # Šablona env proměnných
├── CLAUDE.md                         # Tento soubor
├── CHANGELOG.md                      # Historie změn
├── HANDMADE_NET_SPEC.md              # Původní produktová specifikace
└── PROJECT_STATUS.md                 # Detailní stav projektu
```

---

## 4. Databázové entity a vztahy

```
users (1) ─── (1) maker_profiles (1) ─── (N) products (1) ─── (N) product_images
                                                           └── (N) ai_optimizations
affiliate_links (samostatná tabulka)
```

**users:** id, email, passwordHash, role (admin/maker), plan (free/mini/midi/max),
isFoundingMember, emailVerified, emailVerificationToken, passwordResetToken,
passwordResetExpires, aiUsageThisMonth, aiUsageResetAt

**maker_profiles:** id, userId, brandName, bio, profileImageUrl, videoUrl, marketplaceLinks (JSONB)

**products:** id, makerId, titleOriginal, descriptionOriginal, priceOriginal, category,
status (draft/analyzed/completed), etsyListingId

**ai_optimizations:** id, productId, titleOptimized, descriptionOptimized, keywords (JSONB),
pricingRecommendation, competitivenessScore (0-100), aiModelUsed, platform (etsy/amazon)

**TypeORM synchronize:** `true` pro development, `false` pro production.
Na serveru je dočasně NODE_ENV=development pro auto-synchronizaci (viz TODO níže).

---

## 5. API Endpointy (vše s prefixem `/api`)

```
POST /auth/register          Registrace (emailVerificationToken jen logován do konzole)
POST /auth/login             → { access_token, user }
POST /auth/verify-email      ?token=xxx
POST /auth/forgot-password   (token jen do konzole)
POST /auth/reset-password
GET  /auth/me                JWT required

GET    /makers/profile       JWT required
POST   /makers/profile       JWT required, body: { brandName, bio?, videoUrl? }
PATCH  /makers/profile       JWT required

GET    /products             JWT required (jen vlastní produkty)
POST   /products             JWT required
GET    /products/:id         JWT required
PATCH  /products/:id         JWT required
DELETE /products/:id         JWT required

POST   /products/:id/analyze         JWT required, ?platform=etsy|amazon
GET    /products/:id/optimizations   JWT required
```

---

## 6. AI Service — jak funguje

**Soubor:** `backend/src/ai/ai.service.ts`

1. Zkontroluje měsíční kvótu uživatele (dle plánu: free=5, mini=30, midi=150, max=∞)
2. Pokud nový měsíc → resetuje čítač
3. Zavolá `claude-haiku-4-5-20251001` s promptem obsahujícím produkt + platform
4. **Stripuje markdown** z odpovědi (Claude někdy vrací ```json...```)
5. Parsuje JSON
6. Uloží do `ai_optimizations`, aktualizuje `products.status = analyzed`
7. Aktualizuje `aiUsageThisMonth` v DB

**Výstup AI:**
```json
{
  "optimized_title": "...",
  "optimized_description": "...",
  "keywords": ["...", ...],
  "pricing_recommendation": "...",
  "competitiveness_score": 0-100
}
```

---

## 7. Design systém (frontend)

**Barevná paleta (oklch):**
- Background: `oklch(0.973 0.008 80)` — teplá slonová kost
- Card: `oklch(0.94 0.012 75)` — písečná
- Foreground: `oklch(0.22 0.04 48)` — hluboká teplá hnědá
- Muted: `oklch(0.52 0.04 50)` — střední hnědá
- Accent (tyrkysová): `oklch(0.78 0.11 196)` — `#00CED1`
- Emerald: `oklch(0.65 0.15 155)` — `#00A86B`
- Border: `oklch(0.85 0.02 72)` — písečná

**Fonty:**
- Nadpisy: `Cormorant Garamond` (CSS var: `--font-heading`) — elegantní serif
- Tělo: `DM Sans` (CSS var: `--font-body`) — čistý sans-serif

**shadcn/ui verze:** base-nova (používá `@base-ui/react`, NE Radix UI)
- **POZOR:** `asChild` prop neexistuje. Místo `<Button asChild><Link>` použij:
  ```tsx
  import { buttonVariants } from "@/components/ui/button"
  import { cn } from "@/lib/utils"
  <Link href="..." className={cn(buttonVariants({ variant: "outline" }))}>text</Link>
  ```

**Dekorativní třídy** (v globals.css):
- `.heading-accent` — přidá tyrkysovo-smaragdovou čáru pod nadpis
- `.card-mystical` — jemný glow efekt v pravém horním rohu karty

---

## 8. Auth flow (frontend)

- JWT token uložen v `localStorage` jako `access_token`
- `lib/api.ts` — přidává `Authorization: Bearer <token>` ke každému requestu
- Na 401 → smaže token, přesměruje na `/login`
- `lib/auth-context.tsx` — `AuthProvider` + `useAuth()` hook
- Chráněné stránky jsou v `(app)/` route group, layout.tsx redirectuje na `/login` pokud není token

---

## 9. Infrastruktura a deploy

**Server:** Hetzner Cloud CX22, Ubuntu 22.04, IP: `46.224.46.43`
**Nginx:** reverse proxy `/` → frontend:3000, `/api` → backend:3001
**Object Storage:** bucket `handmade-media`, Hetzner FSN1, endpoint: `https://fsn1.your-objectstorage.com`
**Firewall:** porty 22, 80, 443, 2222 otevřeny

**Produkční deploy na serveru:**
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

**GitHub repo:** https://github.com/daasadr/handmade.git, větev `master`

**DŮLEŽITÉ pro deploy:**
- Agent vytváří kód lokálně a pushuje na GitHub
- Na server nasazuje **uživatel ručně** (server je zaheslovaný, citlivý)
- Agent připraví instrukce co přesně spustit na serveru

---

## 10. Tarify a měsíční kvóty

| Plán | Optimalizací/měsíc | Cena (plánovaná) |
|------|-------------------|-----------------|
| free | 5 | zdarma |
| mini | 30 | 9 € |
| midi | 150 | 24 € |
| max | ∞ (99999) | 59 € |

Stripe platby jsou **fáze 2** — zatím neimplementováno. Plán se mění ručně v DB.

---

## 11. Co chybí — prioritní TODO

### Kritické (implementovat jako první):
1. **S3 upload obrázků produktů** — `POST /products/:id/images`
   - Použít `multer` (v deps) + `@aws-sdk/client-s3` (v deps)
   - Uložit URL do `product_images` tabulky
   - Zobrazit fotky v `products/[id]/page.tsx`
   - Přidat fotky do AI promptu (Claude vision — base64 nebo URL)

2. **TypeORM migrace** místo `synchronize: development`
   - Vygenerovat migraci z aktuálního stavu
   - Nastavit `NODE_ENV=production` na serveru
   - Spouštět migrace při deployi

3. **SMTP email odesílání**
   - Implementovat `@nestjs/mailer` nebo `nodemailer`
   - Odeslat ověřovací email při registraci
   - Odeslat reset-password email
   - Doporučeno: Resend.com (jednoduché API, free tier)

4. **S3 upload profilové fotky** — `POST /makers/profile/image`

### Důležité (před veřejným launchem):
5. **Admin modul** — správa uživatelů, nastavení plánů, statistiky
6. **Charity modul** — backend + frontend stránka (dle specifikace)
7. **Affiliate modul** — AffiliateModule, controller, service (entita existuje)
8. **Founding Member** — feature flag systém
9. **DNS přesměrování** — handmade.net → 46.224.46.43 (uživatel to udělá ručně na weby.cz)

### Fáze 2:
10. **Stripe platby** — předplatné, webhook, aktualizace plánů
11. **Etsy OAuth 2.0** — přímý push listingů přes Etsy v3 API
12. **Amazon CSV export** — Amazon flat-file formát ke stažení
13. **Bulk import** — CSV feed + BullMQ fronta

---

## 12. Známé bugy a jejich stav

| Bug | Stav | Soubor |
|-----|------|--------|
| AI vrací JSON v markdown blocích | ✅ Opraveno | `ai/ai.service.ts` |
| DTO bez class-validator dekorátorů | ✅ Opraveno | `makers/makers.service.ts`, `products/products.service.ts` |
| NODE_ENV natvrdo v docker-compose.prod.yml | ⚠️ Dočasné řešení | `docker-compose.prod.yml` (je development) |
| AI usage counter — nutno ověřit ukládání do DB | 🔍 Neověřeno | `ai/ai.service.ts`, `ai.controller.ts` |
| MakersService.findById zbytečné volání | 🔍 Minor | `products/products.service.ts:24` |

---

## 13. Pravidla pro práci agenta

1. **Před každou prací** přečti `CHANGELOG.md` a `PROJECT_STATUS.md`
2. **Po každé změně** zapiš záznam do `CHANGELOG.md` dle formátu v tom souboru
3. **Commituj** po každé smysluplné změně s výstižnou commit zprávou v angličtině
4. **Push na GitHub** po každém commitu (větev `master`)
5. **Na server nenasazuj** — připrav instrukce pro uživatele co má spustit
6. **Konzultuj s uživatelem** pouze skutečně důležitá architektonická rozhodnutí
7. **Neměň** barevnou paletu, fonty ani design systém bez výslovného souhlasu
8. **DTO vždy** opatři class-validator dekorátory (`@IsString()`, `@IsOptional()`, atd.)
9. **shadcn/ui** — nepoužívej `asChild`, použij `buttonVariants` + `Link` (viz sekce 7)
10. **Testuj build** před pushnutím: `cd frontend && npx next build`

---

## 14. Env proměnné (přehled)

```env
# Databáze
POSTGRES_PASSWORD=...           # silné heslo
DATABASE_URL=...                # automaticky sestaveno v docker-compose

# JWT
JWT_SECRET=...                  # min 32 znaků
JWT_EXPIRES_IN=7d

# AI
ANTHROPIC_API_KEY=sk-ant-...   # Claude API

# S3 (Hetzner Object Storage)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_BUCKET=handmade-media
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=eu-central

# Email (zatím neimplementováno)
# SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

# App
NODE_ENV=development            # na serveru dočasně development (kvůli synchronize)
PORT=3001
FRONTEND_URL=http://46.224.46.43
NEXT_PUBLIC_API_URL=http://46.224.46.43/api
```
