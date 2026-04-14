# Handmade.net — Projektová specifikace pro Claude Code
*Verze: 1.0 | Datum: 2026-04*

---

## 1. Co stavíme

**Handmade.net** je SaaS platforma pro handmade výrobce, která jim pomáhá optimalizovat produktové listingy pro marketplace platformy (Etsy, Amazon Handmade) pomocí AI. Platforma NEprodává produkty — funguje jako podpůrný nástroj (tzv. Launchpad model).

Klíčová hodnota: výrobce vloží produkt → AI vygeneruje optimalizovaný název, popis, klíčová slova a doporučení ceny → výrobce použije výstup na svém marketplace účtu.

---

## 2. Tech Stack

| Vrstva | Technologie |
|--------|------------|
| Backend | Node.js + NestJS (REST API) |
| Frontend | Next.js (React) |
| Databáze | PostgreSQL 16 |
| AI | OpenAI API (GPT-4o-mini) |
| Storage | Hetzner Object Storage (S3-compatible) |
| Auth | JWT (access token) |
| Hosting | Hetzner Cloud VPS (Docker + Nginx) |
| Platby | Stripe (fáze 2) |

---

## 3. Struktura projektu

```
handmade/
├── backend/          # NestJS aplikace
│   ├── src/
│   │   ├── auth/         # Registrace, login, JWT
│   │   ├── users/        # Uživatelé a role
│   │   ├── makers/       # Maker profily
│   │   ├── products/     # CRUD produktů
│   │   ├── ai/           # OpenAI integrace
│   │   ├── charity/      # Charity modul
│   │   ├── affiliate/    # Affiliate links
│   │   └── admin/        # Admin rozhraní
│   ├── .env.example
│   └── package.json
├── frontend/         # Next.js aplikace
│   ├── app/
│   │   ├── (auth)/       # Login, registrace
│   │   ├── dashboard/    # Maker dashboard
│   │   ├── products/     # Správa produktů
│   │   ├── profile/      # Maker profil
│   │   ├── charity/      # Charity stránka (public)
│   │   └── admin/        # Admin panel
│   └── package.json
├── docker-compose.yml
└── .env.example
```

---

## 4. Databázová struktura (PostgreSQL)

### users
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
role          ENUM('admin', 'maker') DEFAULT 'maker'
is_founding_member BOOLEAN DEFAULT false
email_verified BOOLEAN DEFAULT false
created_at    TIMESTAMP DEFAULT NOW()
updated_at    TIMESTAMP DEFAULT NOW()
```

### maker_profiles
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID REFERENCES users(id) ON DELETE CASCADE
brand_name        VARCHAR NOT NULL
bio               TEXT
profile_image_url VARCHAR
video_url         VARCHAR
marketplace_links JSONB DEFAULT '{}'
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

### products
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
maker_id             UUID REFERENCES maker_profiles(id) ON DELETE CASCADE
title_original       VARCHAR NOT NULL
description_original TEXT NOT NULL
price_original       DECIMAL(10,2)
category             VARCHAR
status               ENUM('draft', 'analyzed', 'completed') DEFAULT 'draft'
created_at           TIMESTAMP DEFAULT NOW()
updated_at           TIMESTAMP DEFAULT NOW()
```

### product_images
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
product_id  UUID REFERENCES products(id) ON DELETE CASCADE
image_url   VARCHAR NOT NULL
order_index INT DEFAULT 0
```

### ai_optimizations
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
product_id              UUID REFERENCES products(id) ON DELETE CASCADE
title_optimized         VARCHAR
description_optimized   TEXT
keywords                JSONB DEFAULT '[]'
pricing_recommendation  TEXT
competitiveness_score   INT CHECK (competitiveness_score BETWEEN 0 AND 100)
ai_model_used           VARCHAR
created_at              TIMESTAMP DEFAULT NOW()
```

### charity_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
period              VARCHAR NOT NULL  -- např. '2026-04'
revenue_total       DECIMAL(10,2)
percentage_allocated DECIMAL(5,2)
amount_sent         DECIMAL(10,2)
external_proof_url  VARCHAR
created_at          TIMESTAMP DEFAULT NOW()
```

### affiliate_links
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
title       VARCHAR NOT NULL
url         VARCHAR NOT NULL
description TEXT
click_count INT DEFAULT 0
created_at  TIMESTAMP DEFAULT NOW()
```

---

## 5. API Endpointy (REST)

### Auth
```
POST /api/auth/register        # Registrace (email + heslo)
POST /api/auth/login           # Přihlášení → JWT
POST /api/auth/verify-email    # Ověření emailu tokenem
POST /api/auth/forgot-password # Reset hesla
POST /api/auth/reset-password  # Nastavení nového hesla
GET  /api/auth/me              # Aktuální uživatel
```

### Maker profil
```
GET    /api/makers/profile      # Zobrazit vlastní profil
POST   /api/makers/profile      # Vytvořit profil
PATCH  /api/makers/profile      # Upravit profil
POST   /api/makers/profile/image # Upload profilové fotky
```

### Produkty
```
GET    /api/products            # Seznam produktů přihlášeného makera
POST   /api/products            # Vytvořit produkt
GET    /api/products/:id        # Detail produktu
PATCH  /api/products/:id        # Upravit produkt
DELETE /api/products/:id        # Smazat produkt
POST   /api/products/:id/images # Upload obrázků produktu
POST   /api/products/:id/analyze # Spustit AI analýzu
GET    /api/products/:id/optimizations # Historie AI výstupů
```

### Charity (public + admin)
```
GET  /api/charity               # Aktuální charity info (public)
POST /api/charity               # Přidat záznam (admin only)
GET  /api/charity/history       # Historie záznamů (public)
```

### Affiliate
```
GET   /api/affiliate            # Seznam affiliate linků (public)
POST  /api/affiliate/:id/click  # Zaznamenat klik
POST  /api/affiliate            # Přidat link (admin only)
PATCH /api/affiliate/:id        # Upravit link (admin only)
```

### Admin
```
GET   /api/admin/users          # Seznam všech uživatelů
PATCH /api/admin/users/:id      # Upravit uživatele (role, founding member)
GET   /api/admin/stats          # Statistiky platformy
```

---

## 6. AI Workflow (detailní)

Endpoint: `POST /api/products/:id/analyze`

**Vstup z DB:**
- `title_original`
- `description_original`
- `category`
- `price_original`

**Prompt template:**
```
You are an expert in optimizing product listings for handmade marketplaces like Etsy and Amazon Handmade.

Analyze this handmade product and provide optimized listing content:
- Title: {title_original}
- Description: {description_original}
- Category: {category}
- Current Price: {price_original} EUR

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "optimized_title": "SEO-optimized title max 140 chars",
  "optimized_description": "Natural, authentic description with keywords",
  "keywords": ["keyword1", "keyword2", ...],
  "pricing_recommendation": "Brief pricing strategy advice",
  "competitiveness_score": 0-100
}
```

**Parametry volání OpenAI:**
- Model: `gpt-4o-mini`
- Temperature: `0.7`
- Max tokens: `1000`

**Po úspěšném volání:**
1. Uložit výstup do tabulky `ai_optimizations`
2. Aktualizovat `products.status` na `analyzed`
3. Vrátit výstup klientovi

**Rate limiting:** max 10 AI volání za hodinu na uživatele (uložit timestamp posledního volání do Redis nebo jednoduše do DB).

---

## 7. Uživatelské role a oprávnění

| Akce | Visitor | Maker | Founding Maker | Admin |
|------|---------|-------|----------------|-------|
| Zobrazit charity stránku | ✅ | ✅ | ✅ | ✅ |
| Zobrazit affiliate linky | ✅ | ✅ | ✅ | ✅ |
| Registrace/login | ✅ | - | - | - |
| Správa vlastních produktů | ❌ | ✅ | ✅ | ✅ |
| AI analýza | ❌ | ✅ | ✅ | ✅ |
| Founding Member badge | ❌ | ❌ | ✅ | - |
| Přístup k budoucím features | ❌ | ❌ | ✅ | - |
| Admin panel | ❌ | ❌ | ❌ | ✅ |
| Správa charity záznamů | ❌ | ❌ | ❌ | ✅ |

---

## 8. Uživatelský flow

### Nový výrobce:
1. Landing page → klikne "Registrovat se"
2. Vyplní email + heslo → dostane ověřovací email
3. Ověří email → přihlásí se
4. Vyplní maker profil (brand name, bio, foto)
5. Vytvoří první produkt (název, popis, cena, kategorie, fotky)
6. Klikne "Spustit AI analýzu"
7. Zobrazí se původní vs. optimalizovaná verze
8. Zkopíruje výstup → použije na Etsy/Amazon

### Admin:
1. Přihlásí se → dostane se do admin dashboardu
2. Spravuje uživatele (nastavení founding member flagu)
3. Přidává charity záznamy (period, částka, proof URL)
4. Spravuje affiliate linky

---

## 9. Prostředí (.env proměnné)

```env
# Databáze
DATABASE_URL=postgresql://handmade:HESLO@postgres:5432/handmade

# JWT
JWT_SECRET=min_32_znaku_nahodny_retezec
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...

# Hetzner Object Storage (S3-compatible)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_BUCKET=handmade-media
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=eu-central

# Email (pro ověření emailu)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@handmade.net

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## 10. Sprint plán (co stavět v jakém pořadí)

### Sprint 1 — Základ (začněte zde)
- [ ] Inicializace NestJS projektu se základní strukturou modulů
- [ ] Připojení k PostgreSQL pomocí TypeORM
- [ ] Vytvoření všech DB entit a migrací
- [ ] Auth modul: registrace, login, JWT, email verifikace
- [ ] Inicializace Next.js projektu
- [ ] Stránky: Landing, Login, Registrace, Dashboard (skeleton)
- [ ] Docker Compose pro lokální vývoj (backend + frontend + postgres)

### Sprint 2 — Produkty a AI
- [ ] Maker profil CRUD + upload profilové fotky na S3
- [ ] Produkt CRUD + upload obrázků na S3
- [ ] OpenAI integrace — AI analýza produktu
- [ ] Frontend: formulář produktu, zobrazení AI výstupu (before/after)

### Sprint 3 — Profil, Admin, Charita
- [ ] Vylepšený maker profil (video embed, marketplace links)
- [ ] Admin panel (správa uživatelů, founding member flag)
- [ ] Charity modul (backend + frontend stránka)
- [ ] Founding Member feature flag systém

### Sprint 4 — Stabilizace
- [ ] Rate limiting AI volání
- [ ] Error handling a logging
- [ ] Bezpečnostní audit (helmet, CORS, validation pipes)
- [ ] Produkční Docker konfigurace
- [ ] Základní testy (unit + e2e pro auth)

---

## 11. Infrastruktura (již připraveno)

- **Server:** Hetzner Cloud CX22, Ubuntu 22.04, IP: `46.224.46.43`
- **Docker:** nainstalován (verze 29.3.1)
- **Nginx:** nainstalován, nakonfigurován jako reverse proxy
  - `/` → frontend (port 3000)
  - `/api` → backend (port 3001)
- **Object Storage:** bucket `handmade-media` na Hetzner FSN1
- **Firewall:** povoleny porty 22, 80, 443
- **Backups:** zapnuty

**Produkční deploy:** `docker compose up -d` ve složce `/opt/handmade`

---

## 12. Důležité poznámky

- Platforma **NEprodává** produkty — je to optimalizační nástroj
- Competitiveness score je v MVP **heuristický** (AI odhad), ne napojený na živá marketplace data
- Všechny UUID jako primární klíče (připravenost na škálování)
- JSONB pole pro marketplace_links a keywords (flexibilní rozšíření)
- GDPR: žádná data třetích stran, hesla hashována bcrypt
- Stripe integrace je až ve fázi 2 — zatím bez platební brány
- Doména `handmade.net` bude přesměrována na server po získání přístupu k DNS
