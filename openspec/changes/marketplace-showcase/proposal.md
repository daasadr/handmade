# Marketplace showcase (výloha tvůrců + affiliate)

## Why

Handmade.net dnes jen optimalizuje listingy a výsledek si tvůrce odnese jinam. Chybí
veřejná vrstva, která by tvůrce zviditelnila a přivedla jim zákazníky. „Výloha" (veřejný
adresář tvůrců a jejich produktů s odkazy „Koupit na Etsy/Amazon/Fler") staví na tom, co už
máme — profil-příběh, affiliate modul, SEO — a drží model „neprodáváme, pomáháme prodat".

## What Changes

- Tvůrce se může **dobrovolně zveřejnit** ve výloze (opt-in přepínač na profilu). Výchozí stav
  je neveřejný (GDPR, souhlas).
- **Veřejné (nepřihlášené) API** jen pro čtení: seznam zveřejněných tvůrců a detail jednoho
  tvůrce s jeho příběhem a produkty. Vrací jen bezpečná pole (žádný e-mail, kvóta, interní data).
- **Veřejné stránky**: `/vyrobci` (adresář) a `/vyrobci/[id]` (profil-příběh + produkty +
  tlačítka „Koupit na …" mířící na obchod tvůrce / konkrétní listing).
- **Affiliate/odchozí odkazy**: tlačítka vedou na `marketplaceLinks` tvůrce, u Etsy případně
  na konkrétní listing podle `etsyListingId`. Klik se počítá (využije stávající affiliate modul).
- Veřejné stránky jsou **indexovatelné** (SEO/GEO) — doplní se do sitemap.

## Non-goals

- Žádný košík, platby, objednávky ani doprava u nás (zůstáváme launchpad, ne e-shop).
- Žádné recenze/hodnocení v této fázi.
- Žádná komunita (blog/fórum) — samostatná fáze později.
- Nehledáme fulltextem napříč marketplacy; jen naši zveřejnění tvůrci.
