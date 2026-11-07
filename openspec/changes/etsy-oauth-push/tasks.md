# Tasks — Etsy OAuth push

> Ověření u každého úkolu. Backend před zavřením: `cd backend && npm run check`.

## Backend — základ (nezávisí na schválení Etsy)

- [x] 1. **Token cipher** `common/crypto/token-cipher.ts` — AES-256-GCM encrypt/decrypt,
  náhodný IV/záznam, **fail-safe** když `ETSY_TOKEN_KEY` chybí. Komentář PROČ.
  _Ověřeno:_ 4 unit testy (round-trip, jiný IV → jiný ciphertext, GCM integrita, vypnuto bez klíče).
- [x] 2. **Entita** `EtsyConnection` + **migrace** `1760000000000-CreateEtsyConnections.ts`
  (idempotentní). Entita zaregistrována v `app.module.ts` i `data-source.ts`.
  _Ověřeno:_ `npm run check` prošel; timestamp vyšší než 1759.
- [x] 3. **EtsyOAuthService** — PKCE (verifier/challenge/state), in-memory state store s TTL,
  `buildAuthorizeUrl()`, `exchangeCode()`, `refreshAccessToken()`. `client_id`/`secret`
  z `ETSY_API_KEY` (split na prvním `:`). Nelogujeme tokeny. Obnova + rotace refresh tokenu
  v `EtsyConnectService.getAccessContext()` (+ in-memory cache access tokenu).
  _Ověřeno:_ typecheck; logika PKCE přes node:crypto.
- [x] 4. **EtsyListingService.createDraft(user, productId)** — vlastnictví v dotazu (404),
  načte nejnovější Etsy optimalizaci, čistý `buildDraftListingPayload`, POST Etsy, uloží
  `etsyListingId`, vrátí odkaz. `InFlightLock` proti dvojkliku. Čekatelné chyby (nikdy 401).
  _Ověřeno:_ 6 unit testů mapování (title 140, 13 tagů ≤20 znaků, prázdné tagy, cena fallback, defaulty).
- [x] 5. **Controllery** — `EtsyConnectController` (`/etsy/oauth/start` JWT, `/etsy/oauth/callback`
  veřejný+redirect, `GET/DELETE /etsy/connection`) + `EtsyDraftController` (`POST /products/:id/etsy-draft`).
  _Ověřeno:_ `npm run check`; ruční průchod až po aktivaci klíče (task 9).
- [x] 6. **Modul + env** — `EtsyConnectModule` zapojen. `ETSY_TOKEN_KEY` + `ETSY_DEFAULT_TAXONOMY_ID`
  v `.env.example` (hodnota `XXX`/prázdné, komentář „jen server"). Fail-safe guard.
  _Ověřeno:_ typecheck; modul se zaregistroval bez pádu.

## Frontend

- [x] 7. **Profil — „Propojit s Etsy" / „Zrušit propojení"** + stav (propojeno — obchod …).
  i18n CS/EN. Volá `/etsy/oauth/start` a přesměruje; návrat `?etsy=connected|error` → toast
  + úklid URL (přes `window.location`, ne useSearchParams → bez Suspense). Karta jen když
  je funkce zapnutá (status != null).
  _Ověřeno:_ `npx tsc --noEmit` čistý.
- [x] 8. **Detail produktu — „Odeslat koncept na Etsy"** (jen u Etsy optimalizace; propojeno →
  tlačítko, nepropojeno → odkaz na profil, vypnuto → nic). Po úspěchu otevře koncept. i18n CS/EN.
  _Ověřeno:_ `npx tsc --noEmit` čistý.

## Po schválení Etsy (živý test)

- [ ] 9. Doplnit callback URL v Etsy *Settings*, nový klíč + `ETSY_TOKEN_KEY` do serverového `.env`,
  nasadit, propojit vlastní obchod, odeslat koncept, ověřit v Etsy.
  _Ověření:_ koncept se objeví v obchodě se správným názvem/popisem/tagy.

## Výloha — koncept vs. zveřejněno

- [x] 12. **Buy link jen u zveřejněných.** `Product.etsyListingActive` (bool) + migrace 1761.
  Push nastaví false (koncept). `EtsyListingService.syncListingState()` ověří stav přes Etsy
  a překlopí (ukládá jen odvozený bool). `POST /products/:id/etsy-listing-state`. Výloha
  (`public.service`) vystaví `etsyListingId` jen když `active`. Frontend: stav na detailu
  produktu (koncept → návod + „Už jsem zveřejnil", auto-sync po návratu), typy + i18n CS/EN.
  _Ověřeno:_ `npm run check` (26 testů) + `tsc` čisté.

## Závěr

- [x] 10. **Review bezpečnosti** (OAuth, tajemství, vstup uživatele) — nálezy v `design.md`.
- [ ] 11. **CHANGELOG + archivace** změny po dokončení (archivace až po živém testu task 9).
