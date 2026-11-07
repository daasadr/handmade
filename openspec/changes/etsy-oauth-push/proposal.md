# Etsy OAuth push (koncept listingu jedním tlačítkem)

## Why

Dnes výrobce výsledek optimalizace **ručně kopíruje** do Etsy (pole po poli), případně
stáhne `.txt`. Je to tření na poslední míli, kde se rozhoduje, jestli nástroj reálně
používá. Etsy nemá CSV/feed import listingů — jediná „jednotlačítková" cesta je
**Etsy Open API v3 + OAuth 2.0**: výrobce jednou propojí svůj Etsy obchod a pak tlačítkem
pošle optimalizovaná data jako **koncept listingu** přímo do svého obchodu.

Appka `handmadenet` je u Etsy založená a čeká na schválení (commercial / general public).
Většina práce na schválení nezávisí — závisí na něm jen test naostro. Proto stavíme teď,
ať je hotovo, až schválení přijde.

## What Changes

- **Propojení účtu (opt-in):** výrobce na svém profilu klikne „Propojit s Etsy" → OAuth 2.0
  (Authorization Code + PKCE) → my si bezpečně (šifrovaně) uložíme jeho **refresh token**.
  Výchozí stav je nepropojeno. Propojení lze kdykoli zrušit (token smažeme).
- **Odeslání konceptu:** na detailu produktu u Etsy optimalizace přibude tlačítko
  „Odeslat koncept na Etsy". Zavolá `createDraftListing` v obchodě výrobce s názvem, popisem,
  cenou, 13 tagy a materiály. Vznikne **koncept** (ne zveřejněný listing).
- **Access token se nikdy neukládá dlouhodobě** — drží se jen refresh token (šifrovaně);
  access token se obnovuje za běhu a je krátkodobý.
- Minimální OAuth scope: `listings_r listings_w`. Žádné čtení tržeb (viz Non-goals).

## Non-goals

- **Ne** publikace listingu naostro. Vzniká koncept; dopravní profil, fotky a `who_made/
  when_made` si výrobce doplní a listing zveřejní v Etsy sám (Etsy je k publikaci vyžaduje
  a my je spolehlivě nemáme).
- **Ne** čtení prodejů/tržeb (`transactions_r`) — samostatný budoucí úkol `handmade-qd1`
  (větší souhlas = horší konverze; Etsy Terms + GDPR u transakcí).
- **Ne** synchronizace zpět z Etsy do nás, ani hromadný push více produktů najednou.
- **Ne** push na Amazon/Fler (Amazon má flat-file CSV; Fler nemá veřejné API).
- **Ne** ukládání jakýchkoli surových dat z Etsy nad rámec ID konceptu (Etsy API Terms).
