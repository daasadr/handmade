# Design — Etsy OAuth push

## OAuth 2.0 flow (Authorization Code + PKCE)

Etsy v3 vyžaduje PKCE. Flow:

1. **Start** (`GET /etsy/oauth/start`, JWT): backend vygeneruje `code_verifier` (náhodných
   ~64 B), `code_challenge = base64url(SHA256(verifier))`, `state` (náhodný, CSRF).
   Dvojici `{state → {verifier, userId}}` uloží **krátkodobě** (TTL ~10 min). Vrátí authorize URL:
   `https://www.etsy.com/oauth/connect?response_type=code&client_id=<keystring>&redirect_uri=<cb>&scope=listings_r%20listings_w&state=<state>&code_challenge=<challenge>&code_challenge_method=S256`
2. **Callback** (`GET /etsy/oauth/callback?code=&state=`): ověř `state` (jinak 400 a konec).
   Vyměň `code` za tokeny: `POST https://api.etsy.com/v3/public/oauth/token`
   `grant_type=authorization_code, client_id, redirect_uri, code, code_verifier`.
   Odpověď: `access_token` (platný 1 h), `refresh_token` (90 dní). `etsyUserId` =
   část `access_token` před tečkou. Získej `shop_id` z `GET /v3/application/users/{user_id}/shops`.
   Ulož **šifrovaný refresh token** + `etsyUserId`, `shopId`, `scopes`. Přesměruj zpět na profil.
3. **Obnova**: před každým voláním, pokud access token chybí/vypršel, obnov přes
   `grant_type=refresh_token`. Access token drž jen v paměti requestu, **neukládej do DB**.

`client_id` = keystring, `client_secret` = shared secret. Oboje už je v serverovém `.env`
jako `ETSY_API_KEY="keystring:shared_secret"` — rozdělíme na dvojtečce (stejně jako to dělá
`common/etsy/etsy.service.ts`). `redirect_uri` sestavíme z `FRONTEND_URL` + `/etsy/callback`
(frontendová stránka, která zavolá backend callback) — přesnou hodnotu zadáme do Etsy *Settings*
po schválení.

## Šifrování tokenů (klidový stav)

Refresh token je dlouhodobé tajemství tvůrce → **šifrovat at rest** (AES-256-GCM).
Nový env `ETSY_TOKEN_KEY` (≥32 znaků). Util `common/crypto/token-cipher.ts`
(`encrypt`/`decrypt`, náhodný IV na záznam, authtag).

**Fail-SAFE, ne fail-fast** (korekce oproti prvnímu návrhu): když `ETSY_TOKEN_KEY` chybí,
`TokenCipher.isConfigured()` vrátí false a Etsy endpointy slušně odmítnou 503
„není nakonfigurováno". NESMÍ to shodit celý backend — Etsy je bonusová funkce (jako
konkurence v `EtsyService`), a deploy bez klíče by jinak sundal i přihlášení. To je rozdíl
oproti `JWT_SECRET`, který fail-fastuje v `main.ts` (JWT je jádro, Etsy ne). Komentář PROČ
u klíče i u cipheru (CLAUDE.md 15.1).

## Entita + migrace

`EtsyConnection` (1:1 na userId): `id`, `userId` (unique, FK users), `etsyUserId`, `shopId`,
`refreshTokenEnc` (text, šifrovaný), `scopes`, `connectedAt`, `updatedAt`.
→ migrace `1760000000000-CreateEtsyConnections.ts` (idempotentní raw SQL, timestamp vyšší než
poslední existující). **Nikdy** nelogovat obsah tokenu.

## Mapování na createDraftListing

`POST /v3/application/shops/{shop_id}/listings` (stav `draft`). Pole:
- `title` ← `titleOptimized` (Etsy limit 140 znaků, ořež), `description` ← `descriptionOptimized`,
  `price` ← `product.priceOriginal`, `quantity` = 1, `tags` ← `keywords` (≤13, každý ≤20 znaků,
  už ořezáváme), `materials` ← `platformFields.materials`.
- **Povinná Etsy pole bez našeho ekvivalentu**: `who_made` (default `i_did`), `when_made`
  (default `made_to_order`), `taxonomy_id`, `type` = `physical`, `is_supply` = false.
- ⚠️ **Otevřená otázka — `taxonomy_id`**: naše `product.category` je volný text, Etsy chce
  číselné ID z taxonomie. V1: necháme výrobce v Etsy konceptu kategorii doplnit/opravit; použijeme
  bezpečný default (nejobecnější taxonomy_id) nebo jednoduché mapování nejčastějších kategorií.
  Fotky a dopravní profil **neřešíme** (koncept je bez nich; výrobce doplní).

Po úspěchu ulož jen `etsyListingId` k produktu (už sloupec máme) a vrať odkaz na koncept.
**Neukládej** žádná další data z Etsy odpovědi (Etsy Terms).

## Chyby, limity, bezpečnost

- `translateEtsyError()` — nikdy nevracej 401 ven (CLAUDE.md 15.3); mapuj na čekatelné stavy
  s větou „co dělat" (např. „Propojení s Etsy vypršelo, propoj se prosím znovu").
- Rate limit Etsy appky: 5 QPS / 5k denně — náš objem bezpečně vejde.
- Ownership: produkt i connection ověřuj **v dotazu** (`where: { id, maker: { userId } }`), 404.
- Zámek proti dvojkliku na „Odeslat" (stejný `InFlightLock` jako u analyze), ať nevzniknou dva koncepty.
- Review bezpečnosti jako samostatný úkol (OAuth + tajemství + vstup uživatele → CLAUDE.md 16).

## Dopad závislostí

Bez nové runtime závislosti: OAuth i volání Etsy jde přes `fetch`/`undici` (jako stávající
`etsy.service.ts`); PKCE/šifrování přes vestavěný `node:crypto`. Žádný dopad na bundle frontendu
(tlačítka jen volají naše API). Žádný dopad na výkon mimo síťové volání Etsy při odeslání.
