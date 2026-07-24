# LEGAL_TODO — co doplnit do právních textů

> **INTERNÍ dokument. Nepublikuje se** (není to webová stránka, jen soubor v repu).
> Vznikl proto, aby vnější testeři neviděli poznámky „[DOPLŇTE …]" přímo v podmínkách.
>
> Z publikovaných stránek `/podminky` a `/gdpr` byly všechny placeholdery a žluté
> výhrady odstraněny. Texty teď zní čistě a odkazují na „provozovatele služby
> Handmade.net" a kontakt `info@handmade.net`. Níže je seznam, co ještě doplnit,
> než půjde služba naostro s reálnými zákazníky.

Řádky jsou orientační (mohou se posunout při dalších úpravách) — vždy je uveden i
text, který se dá vyhledat.

---

## 1. Identita provozovatele / správce

Zatím je všude jen obecně „provozovatel služby Handmade.net". Doplnit **jméno / název
firmy, IČO a sídlo** (a ideálně je uvést do textu i jako správce údajů pro GDPR).

| Soubor | ~řádek | Co je tam teď | Co doplnit |
|--------|--------|---------------|------------|
| `frontend/app/podminky/page.tsx` | ~49 (EN) | „The Service is operated by the provider of Handmade.net" | konkrétní název / firma + sídlo |
| `frontend/app/podminky/page.tsx` | ~176 (CS) | „Provozovatelem je poskytovatel služby Handmade.net" | jméno / firma, IČO, sídlo |
| `frontend/app/gdpr/page.tsx` | ~48 (EN) | „The controller is the operator of Handmade.net" | konkrétní název správce |
| `frontend/app/gdpr/page.tsx` | ~137 (CS) | „Správcem osobních údajů je provozovatel služby Handmade.net" | jméno / firma, IČO, sídlo |

## 2. Předání do USA (Anthropic) — ověřit mechanismus

V GDPR je uvedeno, že předání do USA probíhá „na základě standardních smluvních
doložek (Standard Contractual Clauses)". **Ověřit, že to reálně sedí** — ideálně mít
od Anthropic zpracovatelskou smlouvu (DPA) a podle ní případně formulaci upřesnit.

| Soubor | ~řádek | Text |
|--------|--------|------|
| `frontend/app/gdpr/page.tsx` | ~76 (EN) | „…appropriate safeguards (Standard Contractual Clauses)." |
| `frontend/app/gdpr/page.tsx` | ~166 (CS) | „…odpovídajících záruk (standardní smluvní doložky)." |

## 3. Kontaktní e-mail

`info@handmade.net` je použit v patičce, podmínkách, GDPR i v Etsy doložce.
**Zajistit, že schránka funguje** (nebo e-mail globálně změnit).

## 4. Právní kontrola před ostrým provozem

Anglická i česká verze jsou poctivý pracovní základ, ne právní posudek. Před spuštěním
plateb / reálných zákazníků nechat zkontrolovat právníkem — zejména:
- anglickou verzi (EU báze + americké body / CCPA),
- rozhodné právo a spotřebitelská práva,
- předání do USA.

---

Až bude vše doplněno a zkontrolováno, tento soubor lze smazat.
