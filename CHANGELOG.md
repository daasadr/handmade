# CHANGELOG — Handmade.net

> **Instrukce pro agenta:** Po každé změně přidej záznam na začátek tohoto souboru
> (pod tento blok s instrukcemi) ve formátu níže. Buď konkrétní — piš CO bylo změněno,
> PROČ a JAKÝM způsobem. Uveď i soubory. Nikdy nepřepisuj existující záznamy.

## Formát záznamu:

```
## [YYYY-MM-DD] Krátký název změny

**Typ:** feat | fix | refactor | docs | deploy | config
**Soubory:** seznam změněných souborů
**Commit:** hash nebo "nepushováno"

### Co bylo změněno
Popis změny.

### Proč
Důvod / problém který to řeší.

### Způsob provedení
Technický popis jak bylo řešení implementováno.

### Instrukce pro deploy (pokud potřeba)
Příkazy pro uživatele k provedení na serveru.
```

---

## [2026-05-14] Vytvoření CLAUDE.md a CHANGELOG.md

**Typ:** docs
**Soubory:** `CLAUDE.md`, `CHANGELOG.md`
**Commit:** (tento commit)

### Co bylo změněno
Vytvořena dokumentace pro AI agenty — kompletní popis projektu, stavu implementace, TODO listu a pravidel pro práci.

### Proč
Umožnit AI agentovi plynule navázat na předchozí práci bez nutnosti zjišťovat kontext.

---

## [2026-05-14] Fix: stripování markdown bloků z AI odpovědi

**Typ:** fix
**Soubory:** `backend/src/ai/ai.service.ts`
**Commit:** `84eff21`

### Co bylo změněno
Přidáno stripování markdown code fences (` ```json ... ``` `) z odpovědi Claude před JSON.parse().

### Proč
Claude Haiku někdy obaluje JSON odpověď do markdown bloků i přes instrukci "Respond ONLY with valid JSON". JSON.parse() pak selhal s chybou "AI vrátila neplatný formát odpovědi".

### Způsob provedení
```typescript
const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
parsed = JSON.parse(jsonText);
```

---

## [2026-05-14] Fix: class-validator dekorátory na DTOs

**Typ:** fix
**Soubory:** `backend/src/makers/makers.service.ts`, `backend/src/products/products.service.ts`
**Commit:** `50aa14a`

### Co bylo změněno
Přidány `@IsString()`, `@IsOptional()`, `@IsUrl()`, `@IsNumber()`, `@Min()`, `@Type()` dekorátory na všechna DTO pole.

### Proč
NestJS ValidationPipe s `forbidNonWhitelisted: true` odmítal requesty s chybou "property brandName should not exist" — pole bez dekorátorů jsou považována za nepovolená.

---

## [2026-05-14] Deploy: produkční konfigurace a oprava Nginx

**Typ:** deploy | config
**Soubory:** `docker-compose.prod.yml`, `frontend/next.config.ts`, Nginx config na serveru
**Commit:** `8aef5b6`

### Co bylo změněno
- `docker-compose.prod.yml` — produkční compose bez dev volumes, `restart: unless-stopped`
- `next.config.ts` — přidán `output: "standalone"` pro produkční Docker build
- Nginx nakonfigurován jako reverse proxy (`/api` → backend:3001, `/` → frontend:3000)
- Otevřeny porty 80 a 443 ve firewallu (`ufw allow 80/tcp`)

### Instrukce pro deploy
Nginx config upraven ručně na serveru v `/etc/nginx/sites-enabled/default`.

---

## [2026-05-14] Feat: landing page a stránka tarifů

**Typ:** feat
**Soubory:** `frontend/app/page.tsx`, `frontend/app/tarify/page.tsx`
**Commit:** `1379010`

### Co bylo změněno
- Landing page: hero sekce s gradientním titulkem, sekce platforem (Etsy/Amazon), "Jak to funguje" (3 kroky), "Co dostanete" (6 karet), bottom CTA, footer
- Stránka `/tarify`: 4 plány (Free/Mini/Midi/Max), Mini zvýrazněný jako "Nejoblíbenější"
- Navigace: logo + Jak to funguje | Funkce | Tarify + Přihlásit se | Začít zdarma

---

## [2026-05-13] Feat: kompletní frontend core UI

**Typ:** feat
**Soubory:** `frontend/app/`, `frontend/components/`, `frontend/lib/`
**Commit:** `9dd58a3`

### Co bylo změněno
- Design systém: Cormorant Garamond + DM Sans, slonovinová paleta s tyrkysovými/smaragdovými akcenty
- shadcn/ui (base-nova) inicializace + komponenty: button, input, label, card, badge, textarea, separator, avatar, sonner
- `lib/api.ts` — typovaný API klient, JWT v localStorage, automatický redirect na 401
- `lib/auth-context.tsx` — AuthProvider, useAuth hook
- `(auth)/layout.tsx` — dekorativní pozadí s glow efekty
- `(auth)/login/page.tsx` a `register/page.tsx`
- `(app)/layout.tsx` — chráněný layout, redirect na /login
- `(app)/dashboard/page.tsx` — přehled produktů, kvóta progress bar, stats
- `(app)/products/new/page.tsx` — formulář s výběrem kategorie
- `(app)/products/[id]/page.tsx` — detail + AI analýza (before/after, klíčová slova, skóre, kopírování)
- `(app)/profile/page.tsx` — maker profil + tarif info
- `components/nav.tsx` — navigace pro přihlášené

### Oprava: nested git repo
Frontend byl omylem vnořené git repo (gitlink 160000). Opraveno: odstraněn `frontend/.git`, soubory přidány přímo do hlavního repo.

---

## [2026-05-12] Feat: initial project scaffold

**Typ:** feat
**Soubory:** celý projekt
**Commit:** `dfcb506`

### Co bylo změněno
- NestJS backend se všemi moduly: auth, users, makers, products, ai, affiliate
- TypeORM entity: User, MakerProfile, Product, ProductImage, AiOptimization, AffiliateLink
- AI service: Claude Haiku 4.5, měsíční kvóty dle plánů, platform-specific prompty
- Docker Compose (dev + prod)
- Základní Next.js frontend (placeholder)
- `.env.example`, `.gitignore`, `HANDMADE_NET_SPEC.md`, `PROJECT_STATUS.md`
- GitHub repo: https://github.com/daasadr/handmade.git
- LICENSE: All rights reserved
