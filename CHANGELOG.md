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

## [2026-07-23] Analýzy zvlášť pro každou platformu + přidán český Fler

**Typ:** feat
**Soubory:** `backend/src/ai/ai.service.ts`, `backend/src/ai/ai.controller.ts`, `frontend/lib/api.ts`, `frontend/app/(app)/products/[id]/page.tsx`, `frontend/app/(app)/napoveda/page.tsx`

### Co bylo změněno
- **Analýzy pro různé platformy se už nepřekrývají v zobrazení.** Produkt může mít analýzu pro Etsy, Amazon i Fler zároveň a všechny zůstanou. Detail produktu zobrazuje analýzu pro právě vybranou platformu; u platforem s hotovou analýzou je na přepínači fajfka ✓.
- **Přidán český marketplace Fler** jako třetí platforma. Výstup analýzy je pro Fler **rovnou česky** (název, popis, klíčová slova i cenové doporučení) — bez anglického originálu a překladu.

### Proč
Data se ve skutečnosti nikdy nepřepisovala — `ai.service` vždy vytváří nový řádek. Problém byl jen v UI: `latestOpt` ukazoval poslední analýzu bez ohledu na platformu, takže po analýze pro Amazon „zmizela" ta pro Etsy. Uživatelé potřebují mít obě/všechny.

Fler byl přidán na zkoušku jako lokální varianta pro český trh.

### Způsob provedení
- Frontend drží **všechny** analýzy (`optimizations[]`) a odvozuje zobrazenou podle vybrané platformy (`displayedOpt = find(platform)`, seznam řazen od nejnovější). Backend se v ukládání neměnil.
- Prompt v `ai.service` se pro Fler větví: JSON schéma i jazyk jsou české, pole `title_czech`/`description_czech`/`pricing_recommendation_czech` zůstanou prázdná (frontend český blok zobrazuje jen když je neprázdný, takže žádná redundance).
- Nový typ `Platform = 'etsy' | 'amazon' | 'fler'` sdílený backend/frontend. Konkurence z Etsy zůstává jen pro Etsy (Fler i Amazon mají AI skóre).

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```
Bez DB změn (analýzy se ukládaly po řádcích už dřív).

---

## [2026-07-23] Přehled konkurence z Etsy + skóre z reálného trhu

**Typ:** feat
**Soubory:** `backend/src/common/etsy/etsy.service.ts` (nový), `backend/src/common/etsy/etsy.module.ts` (nový), `backend/src/ai/market-score.ts` (nový), `backend/src/migrations/1753200000000-AddCompetitionData.ts` (nový), `backend/src/ai/ai-optimization.entity.ts`, `backend/src/ai/ai.service.ts`, `backend/src/ai/ai.module.ts`, `frontend/lib/api.ts`, `frontend/app/(app)/products/[id]/page.tsx`, `frontend/app/(app)/napoveda/page.tsx`, `.env.example`, `CLAUDE.md`

### Co bylo změněno
- **`EtsyService`** — vyhledá aktivní konkurenční listingy na Etsy Open API v3 a vrátí snímek: počet nabídek, cenové rozpětí (min/medián/max) a nejčastější tagy.
- **`market-score.ts`** — spočítá skóre konkurenceschopnosti 0–100 z reálných dat: cenová pozice (0–40) + nasycenost trhu (0–30) + relevance klíčových slov vůči tagům konkurence (0–30).
- **`ai.service.ts`** — u Etsy analýz (a jen když je klíč) nahradí odhad AI skóre z trhu a uloží snímek konkurence. Pole `scoreSource` = `'market'` / `'ai'`.
- **Frontend** — u výsledku štítek zdroje skóre („★ z reálného trhu" / „odhad AI") a přehled konkurence (počet, ceny, porovnání vlastní ceny, tagy). Nápověda aktualizována.
- **Migrace** pro nové sloupce na `ai_optimizations`.

### Proč
Skóre bylo dosud jen subjektivní odhad AI bez reálných dat (viz předchozí diskuze). Výrobci potřebují skutečný přehled o konkurenci — kolik jí je a za kolik prodává — a skóre opřené o data.

### Způsob provedení
**Fail-safe a additivní.** Bez `ETSY_API_KEY` nebo při jakékoliv chybě Etsy API vrací `EtsyService` `null` a analýza proběhne se stávajícím AI skóre — nic se nerozbije. Veškerá znalost Etsy je izolovaná v `EtsyService`, zbytek aplikace pracuje s neutrálním `CompetitionSnapshot`.

**Amazon záměrně vynechán** — nemá veřejné vyhledávací API, takže tam zůstává odhad AI (v UI i nápovědě přiznáno).

Nová DB pole mají **migraci** (na rozdíl od minulé chyby s VIP).

### ⚠️ Potřeba od uživatele
1. Zaregistrovat aplikaci na https://www.etsy.com/developers a získat „Keystring".
2. Doplnit `ETSY_API_KEY=...` do `.env` na serveru.
3. **Ověřit proti reálnému API** (nešlo otestovat bez klíče): endpoint `/listings/active`, tvar ceny `{amount, divisor, currency_code}`, pole `count`/`results`/`tags`. Vše je v jediné metodě `EtsyService.searchCompetition()`, případná úprava je lokální.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```
Migrace proběhne sama. Bez `ETSY_API_KEY` funguje vše jako dosud (AI skóre); po doplnění klíče se u Etsy analýz objeví reálný přehled.

---

## [2026-07-21] HOTFIX: chybějící migrace pro VIP sloupce shodila přihlášení

**Typ:** fix
**Soubory:** `backend/src/migrations/1753100000000-AddVipAccounts.ts` (nový)
**Commit:** nepushováno

### Co bylo změněno
Přidána migrace, která vytvoří sloupce `users.isVip` a `users.vipUntil`.

### Proč
Commit `94aca93` přidal tyto sloupce do entity `User`, **ale bez migrace**. Na produkci běží `NODE_ENV=production`, takže `synchronize` je vypnuté a sloupce se nevytvořily. TypeORM je přesto vkládal do každého SELECTu nad `users` — a protože přihlášení začíná načtením uživatele, **spadlo přihlášení včetně Google OAuth** na `column User.isVip does not exist` (HTTP 500 na `/api/auth/google/callback`).

Chyba vznikla tím, že CLAUDE.md (sekce 4 a bod 2 v TODO) uvádí `synchronize: true` a migrace jako nedodělek — ve skutečnosti už projekt migrace používá (`src/migrations/`, `migrationsRun: true`) a server na produkčním NODE_ENV běží. **Sekce 4 a bod 2 v CLAUDE.md je proto potřeba opravit**, jinak se to zopakuje.

### Způsob provedení
Raw SQL s `ADD COLUMN IF NOT EXISTS` místo `queryRunner.addColumns()` — sloupce mohly být doplněny ručně při hašení výpadku a `addColumns()` by pak selhalo. Migrace je tak idempotentní.

Ověřeno, že jiná drift neexistuje: od poslední migrace (`bd30275`) sahal do entit jen commit `94aca93`.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```
Migrace se spustí sama při startu backendu (`migrationsRun: true`). Ověření:
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U handmade -d handmade -c '\d users' | grep -i vip
```

---

## [2026-07-21] Srozumitelné chyby AI analýzy místo „Internal server error"

**Typ:** fix
**Soubory:** `backend/src/ai/ai.service.ts`
**Commit:** nepushováno

### Co bylo změněno
Volání Anthropic API je obalené v try/catch a chyby překládá nová metoda `translateAnthropicError()`:

| Příčina | HTTP | Co uvidí uživatel |
|---|---|---|
| Vyčerpaný kredit / neplatný API klíč | 503 | „AI analýza je dočasně nedostupná kvůli technickému problému na naší straně… Kvóta se vám nestrhla." |
| Rate limit (429) | 429 | „Právě teď probíhá hodně analýz naráz…" |
| Přetížení (500/529) | 503 | „AI služba je momentálně přetížená…" |
| Výpadek sítě | 503 | „Nepodařilo se spojit s AI službou…" |

Skutečná příčina jde přes `Logger` do server logu, uživateli se neukazuje.

### Proč
Když došel kredit na Anthropic API, SDK vyhodilo výjimku, kterou nikdo nechytal — NestJS ji převedl na **500 „Internal server error"**. Uživatel neměl šanci zjistit, co se děje, a klikal na „Spustit znovu" dokola (viz opakované 500 v konzoli).

### Způsob provedení
Použity typované třídy z `@anthropic-ai/sdk` (`APIError`, `RateLimitError`, `AuthenticationError`, `APIConnectionError`) místo porovnávání textu chyby.

Dvě věci, na kterých záleží:
- **Nikdy nevracíme 401.** Frontend na 401 maže token a odhlašuje (`lib/api.ts`), takže vypršelý API klíč *platformy* by uživatele vyhodil z jeho vlastního účtu. Auth chyby proto mapujeme na 503.
- **`APIConnectionError` se kontroluje před `APIError`** — v TS SDK je jeho podtřídou, při opačném pořadí by větev pro výpadek sítě byla mrtvý kód.

Kvóta se při selhání nestrhne — čítač zvyšuje až `ai.controller.ts` po úspěšném návratu, takže výjimka ho přeskočí. Hlášky to uživateli explicitně říkají.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

---

## [2026-07-21] Admin UI — správa uživatelů

**Typ:** feat
**Soubory:** `frontend/app/(app)/admin/page.tsx` (nový), `frontend/components/nav.tsx`, `frontend/lib/api.ts`, `backend/src/admin/admin.service.ts`
**Commit:** nepushováno

### Co bylo změněno
- **`/admin`** — nová stránka: statistiky (uživatelé, produkty, VIP účty, platící), rozpad tarifů, seznam uživatelů s vyhledáváním podle e-mailu
- Na každém uživateli lze měnit **tarif, roli, VIP (vč. data expirace) a Founding Member** — vše jedním kliknutím s optimistickým updatem
- **`nav.tsx`** — odkaz „Administrace" se zobrazí jen účtům s `role=admin`
- **`admin.service.ts`** — `updateUser` odmítne degradovat posledního administrátora

### Proč
VIP účty a tarify šlo dosud měnit jen curlem nebo přímo v DB. Projekt poroste, takže admin rozhraní bude potřeba tak jako tak.

### Způsob provedení
Stránka staví na existujícím admin API (`GET /admin/users`, `PATCH /admin/users/:id`, `GET /admin/stats`), backend se měnit nemusel — kromě pojistky níže.

**Ochrana proti vyzamčení:** admin si přes UI mohl odebrat vlastní roli a ztratit přístup. Řešeno dvěma vrstvami — v UI potvrzovací dialog (jiné znění, pokud jde o posledního admina), na backendu tvrdá kontrola, která degradaci posledního administrátora odmítne. Samotný UI dialog by nestačil, protože `PATCH` jde zavolat i curlem.

Přístup na stránku si hlídá komponenta sama podle `user.role`; odkaz v navigaci se běžným uživatelům jen skrývá. Autoritativní kontrola je na backendu (`RolesGuard` + `@Roles(ADMIN)`), takže skrytí odkazu není bezpečnostní opatření.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```
Pokud ještě nemáte admin účet, povyšte se v DB:
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U handmade -d handmade -c \
  "UPDATE users SET role = 'admin' WHERE email = 'vas@email.cz';"
```

---

## [2026-07-21] VIP účty — neomezené optimalizace zdarma

**Typ:** feat
**Soubory:** `backend/src/users/user.entity.ts`, `backend/src/ai/ai.service.ts`, `backend/src/auth/auth.service.ts`, `backend/src/admin/dto/update-user.dto.ts`, `backend/src/admin/admin.service.ts`, `frontend/lib/api.ts`, `frontend/app/(app)/dashboard/page.tsx`, `frontend/app/(app)/profile/page.tsx`
**Commit:** nepushováno

### Co bylo změněno
- **`user.entity.ts`** — nová pole `isVip: boolean` a `vipUntil: Date | null` (null = neomezeně) + exportovaná funkce `isVipActive(user)`
- **`ai.service.ts`** — aktivní VIP obchází kontrolu měsíční kvóty. Čítač `aiUsageThisMonth` se ale **počítá dál**, abychom věděli, kolik nás komplimentární účty stojí na Anthropic API.
- **`auth.service.ts`** — `isVip` a `vipUntil` přidány do odpovědí `login`, Google OAuth i `getMe` (všechny tři whitelistují pole ručně)
- **Admin** — `PATCH /api/admin/users/:id` umí nastavit `isVip` a `vipUntil`; `GET /api/admin/stats` vrací `vipCount`
- **Frontend** — odznak „★ VIP" na dashboardu, kvóta se zobrazí jako `∞`, v profilu i s datem expirace; VIP nevidí tlačítko „Upgradovat"

### Proč
Potřeba účtů s neomezenými optimalizacemi bez placení — interní testování a plánovaná soutěž o VIP účet pro uživatele.

### Způsob provedení
**Záměrně NENÍ řešeno přes `plan = max`.** `BillingService.handleSubscriptionDeleted` přepisuje `plan` na `free` u každého uživatele s odpovídajícím `stripeCustomerId` — VIP status by tak kdykoliv nenávratně zmizel. Navíc by komplimentární účty splynuly s platícími zákazníky v `getStats().planCounts` a rozbily přehled o tržbách. Samostatný příznak je na obojí imunní.

`vipUntil` pokrývá oba scénáře naráz: interní účty dostanou `null` (napořád), výhry v soutěži konkrétní datum.

### Instrukce pro deploy
Nová DB pole se vytvoří automaticky (`synchronize: true` na serveru). Po nasazení udělit VIP:
```bash
# přes API (vyžaduje účet s role=admin)
curl -X PATCH http://46.224.46.43/api/admin/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"isVip": true}'                                  # napořád
  # -d '{"isVip": true, "vipUntil": "2027-07-21T00:00:00Z"}'   # na rok

# nebo přímo v DB
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U handmade -d handmade -c \
  "UPDATE users SET \"isVip\" = true WHERE email = 'test@handmade.net';"
```

---

## [2026-07-21] Fotky lze přidat už při zakládání produktu

**Typ:** feat
**Soubory:** `frontend/app/(app)/products/new/page.tsx`
**Commit:** nepushováno

### Co bylo změněno
Formulář nového produktu má sekci „Fotografie produktu" — výběr fotek, mřížka náhledů s tlačítkem pro odebrání, limit 10 fotek. Fotky se komprimují hned při výběru (viz `lib/image-upload.ts`), takže odeslání formuláře je rychlé.

### Proč
Fotky šlo dosud přidat až na detailu produktu po jeho uložení — zbytečný druhý krok. Uživatel navíc nemusel tušit, že AI analýza funguje lépe s fotkami.

### Způsob provedení
Klientsky dvoufázově, **beze změny API**: `POST /products` vytvoří produkt, hned nato `POST /products/:id/images` nahraje fotky. Upload endpoint potřebuje ID produktu, takže atomicky to jinak nejde.

Pokud upload fotek selže, produkt zůstane uložený a uživatel je přesměrován na detail s hláškou „Produkt byl uložen, ale fotky se nepodařilo nahrát… Zkuste je přidat na detailu produktu." Selhání fotek tedy neshodí celé uložení.

Zvažovanou alternativou bylo přijímat multipart přímo na `POST /products` — zamítnuto, znamenalo by změnu API kontraktu a jeden velký křehký request.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

---

## [2026-07-21] Automatická komprese fotek + limity a chybové hlášky uploadu

**Typ:** feat
**Soubory:** `frontend/lib/image-upload.ts` (nový), `frontend/lib/api.ts`, `frontend/app/(app)/products/[id]/page.tsx`, `frontend/app/(app)/profile/page.tsx`, `backend/src/common/upload/image-upload.options.ts` (nový), `backend/src/common/upload/upload-exception.filter.ts` (nový), `backend/src/products/products.controller.ts`, `backend/src/makers/makers.controller.ts`, `backend/src/main.ts`
**Commit:** nepushováno

### Co bylo změněno
- **`lib/image-upload.ts`** — klientská komprese: zmenšení na 2000 px delší strany + překódování do WebP q0.82 (fallback JPEG pro starší Safari). Respektuje EXIF rotaci (`imageOrientation: "from-image"`), GIF vynechává (canvas by zabil animaci), při zvětšení výsledku vrací originál. `ImageUploadError` nese hlášku i radu, co má uživatel udělat.
- **`common/upload/image-upload.options.ts`** — sdílené multer limity: 12 MB/soubor, 10 souborů, whitelist MIME typů.
- **`common/upload/upload-exception.filter.ts`** — překládá multer chyby (`File too large`, `Too many files`, `Unexpected field`) do češtiny včetně rady. Ostatní `BadRequestException` propouští beze změny, aby zůstaly validační chyby z `ValidationPipe`.
- **`api.ts`** — fallback hláška pro 413 bez JSON těla (odpověď od nginx).
- **Upload UI** — dávkový upload nepadá kvůli jedné vadné fotce; chybné se vypíšou jako toast, zbytek se nahraje. Doplněna nápověda o formátech a limitu.

### Proč
Uživatel dostával při nahrávání fotek **HTTP 413** — nginx má výchozí `client_max_body_size` 1 MB a fotka z mobilu má 3–8 MB. Backend navíc neměl **žádný** limit velikosti a soubory pufruje přes `memoryStorage()` do RAM, což na CX22 (2 GB) hrozilo pádem kontejneru. Chybové hlášky byly buď anglické (`File too large`), nebo holé `Chyba 413` bez rady.

### Způsob provedení
Komprese probíhá v prohlížeči přes `createImageBitmap` + `canvas.toBlob()`, takže na server jde ~400 kB místo ~6 MB. Server-side komprese (`sharp`) záměrně nepřidána — nativní závislost a těžší Docker build; klientská komprese pokrývá reálný tok, backend limity slouží jako pojistka.

### Instrukce pro deploy
**Nutný ruční zásah do nginx** — bez něj 413 přetrvá pro klienty mimo prohlížeč:
```bash
sudo nano /etc/nginx/sites-available/handmade
# do server { ... } bloku přidat:  client_max_body_size 25M;
sudo nginx -t && sudo systemctl reload nginx

cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

---

## [2026-05-28] Frontend image upload + AI vision podpora

**Typ:** feat
**Soubory:** `frontend/lib/api.ts`, `frontend/app/(app)/products/[id]/page.tsx`, `backend/src/ai/ai.service.ts`
**Commit:** `d632ada`

### Co bylo změněno
- **`api.ts`** — přidán `requestFile` helper pro multipart upload; `products.uploadImages(id, files[])`, `makers.uploadProfileImage(file)`
- **`products/[id]/page.tsx`** — sekce "Fotografie produktu": grid zobrazení fotek, upload zona (prázdný stav + tlačítko "+ Přidat fotky"), badge "vidí N fotek" v AI sekci
- **`ai.service.ts`** — produkt načten s relací `images`; pokud existují fotky, sestaví se vision content (max 4 URL bloky) a předá se Claude — analýza je vizuální

### Proč
AI analýza probíhala "naslepo" bez fotek produktu. Claude nyní vidí skutečné fotografie a může detekovat materiály, barvy a styl.

### Instrukce pro deploy
```bash
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

---

## [2026-05-15] Email service, S3 upload, Charity/Admin/Affiliate moduly

**Typ:** feat
**Soubory:** `backend/src/common/email/`, `backend/src/common/s3/`, `backend/src/charity/`, `backend/src/admin/`, `backend/src/affiliate/`, `backend/src/app.module.ts`, `backend/src/auth/auth.service.ts`, `backend/src/makers/makers.controller.ts`, `backend/src/products/products.controller.ts`, `.env.example`
**Commit:** `8e90d6d`

### Co bylo změněno
- **EmailService** (`common/email/`) — Resend.com integrace; posílá HTML emaily při registraci (ověření) a reset hesla. Bez `RESEND_API_KEY` fallback na console.log.
- **S3Service** (`common/s3/`) — upload/delete souborů na Hetzner Object Storage (S3-compatible)
- **POST /products/:id/images** — multer multi-file upload, ukládá URL do `product_images`
- **POST /makers/profile/image** — single file upload profilové fotky
- **CharityModule** — entita `charity_records`, public GET endpointy, admin-only POST
- **AdminModule** — GET/PATCH uživatelů, GET statistik (pouze role=admin)
- **AffiliateModule** — public GET + click tracking, admin CRUD (entita existovala, modul chyběl)
- **AppModule** — registrovány všechny nové moduly + `CharityRecord` entita
- **.env.example** — přidána sekce `RESEND_API_KEY`

### Proč
Kritické blokkery před launchem: registrace bez ověřovacího emailu a reset hesla bez emailu byly nefunkční. S3 upload je nutný pro produktové fotky. Charity/Admin/Affiliate moduly jsou požadavky ze specifikace.

### Instrukce pro deploy
```bash
# 1. Přidat RESEND_API_KEY do .env na serveru
# 2. Na serveru:
cd /opt/handmade
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
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
