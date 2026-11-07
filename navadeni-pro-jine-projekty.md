---
name: behavioralni-navadeni
description: Jak na web postavit behaviorální navádění — tichou nápovědu, která se ukáže, když návštěvník hledá a nenachází — a cookiefree analytiku, ze které se dá vyhodnotit, jestli pomohlo. Použij vždy, když se do projektu přidává navádění, nápověda, onboarding, „empty state" s radou nebo měření chování návštěvníků.
---

# Behaviorální navádění a cookiefree analytika

Návod pro agenta, který to má na nějakém webu postavit od nuly.
Je psaný podle implementace, která běží v provozu — včetně chyb, které
se při ní udělaly a stály hodiny.

**Zkopíruj tenhle soubor do projektu jako `.claude/skills/navadeni/SKILL.md`**
(nebo `docs/navadeni.md`, nemá-li projekt skilly) a řiď se jím.

---

## Co se staví

Web pozná, že návštěvník **hledá a nenachází**, a tiše ukáže směr. Jedna
nápověda, nenápadná, sama zhasne.

Co se nestaví: vyskakovací okno, odpočet, „ještě neodcházejte", chat
bublina po třech vteřinách, zvýrazněné tlačítko, které bliká, dokud na
ně člověk neklikne.

**Rozdíl mezi službou a temným vzorcem není v tom, kam nápověda ukazuje.**
Je v těchhle čtyřech vlastnostech — a jsou závazné, ne doporučené:

1. **Zhasne sama.** Po pár vteřinách, bez zásahu. Nápověda, kterou musí
   člověk zavřít, je překážka.
2. **Nic nezakrývá.** Nikdy nestojí nad obsahem ani nad ovládáním.
   Nikdy nebere kliknutí.
3. **Nevyrábí naléhavost.** Žádná čísla, která ubývají, žádné „jen
   dnes", žádné počítadlo lidí, kteří se právě dívají.
4. **Je jí málo.** Nejvýš tři za návštěvu a mezi nimi klid. Čtvrtá je
   otravování, ne pomoc.

Když kterákoli z nich padne, není to navádění, je to reklama uvnitř
vlastního webu — a návštěvník to pozná rychleji než ty.

---

## Architektura: automat, ne model

**Začni čistým stavovým automatem. Žádné strojové učení.** Model
potřebuje data, která na začátku nemáš, a bez nich jen hádá — jen
pomaleji a hůř čitelně než pět pravidel.

Rozděl kód na čtyři soubory. Dělba je důležitější než jména:

| Soubor | Co v něm je | Co v něm **není** |
|---|---|---|
| `pravidla.js` | **všechna čísla** — prahy, časy, počty | logika |
| `automat.js` | čisté funkce: stav + událost → nový stav | DOM, časovače, `window` |
| `cil.js` | výběr, na co ukázat | měření |
| `useNavadeni.js` | jediné místo, které ví o myši, dotyku, čase a geometrii | rozhodování |

Proč tak: `automat.js` bez DOM se dá otestovat bez prohlížeče, a to je
rozdíl mezi „napsali jsme testy" a „testy něco hlídají". Všechna čísla
v jednom souboru znamenají, že ladění prahů je jedna změna na jednom
místě — ne hledání po projektu.

### Stavy

Čtyři stačí. Přechody mezi nimi dělají události, ne čas sám.

```
PŘÍCHOD  →  ROZHLÍŽÍ SE  →  HLEDÁ  →  ČTE
```

- **PŘÍCHOD** — první vteřiny. Nenapovídá se **nikdy**. Člověk, který
  právě dorazil, se potřebuje rozkoukat; rada v první vteřině je skok
  do řeči.
- **ROZHLÍŽÍ SE** — pohybuje se po stránce, zatím nic neotevřel.
- **HLEDÁ** — **tady se napovídá.** Pozná se podle toho, že se něco
  děje, ale nic z toho nevede k cíli.
- **ČTE** — něco otevřel a je v tom. Nechat být. Nápověda do čtení je
  vyrušení, i kdyby byla správná.

### Z čeho se pozná „hledá a nenachází"

Signály, které se vyplatí měřit. Vyber dva tři, ne všechny:

| Signál | Jak se měří | Co znamená |
|---|---|---|
| Opakované najetí bez kliknutí | tři a víc přejezdů nad klikacími prvky, žádný klik | váhá mezi možnostmi |
| Ticho po pohybu | pohyb, pak 8–10 s nic | nerozhodl se |
| Opakované rolování nahoru a dolů | dvě obrátky směru nad týmž místem | nenašel, co čekal |
| Přiblížení/oddálení bez akce | tři změny měřítka, nic neotevřel | nepoznal, že je něco klikací |
| Rozepsaný a opuštěný formulář | změna v poli, pak 30 s nic | váhá nad odesláním, ne nad psaním |
| Hloubka rolování na konci | dočetl na konec | nejblíž tomu číst dál |

⚠️ **Ticho samo o sobě nic neznamená.** Člověk si odskočil pro kafe.
Napovídej až po tichu, kterému předcházela aktivita.

⚠️ **Rozepsaný formulář je jediný signál, kde smí nápověda mířit na
dokončení.** Dokončit něco, co člověk sám začal, je pomoc; pobízet ke
koupi někoho, kdo si jen čte, je nátlak.

---

## Jak má nápověda vypadat

Tohle rozhoduje o tom, jestli bude k něčemu. **Nápověda, které si nikdo
nevšimne, je mrtvý kód; nápověda, která trhá oči, je banner.**

### Jedna barva, která na webu nic jiného neznamená

Vyber **jednu** barvu a používej ji **jen** na navádění. Nesmí to být
barva odkazů, tlačítek ani stavových hlášek. Kontrast proti pozadí
aspoň 3:1 (WCAG pro netextové prvky).

Jak ji vybrat v konkrétním stylu webu:

- **Web má jednu výraznou akcentovou barvu?** Vezmi její doplněk nebo
  ji posuň o 30–60° v odstínu. Zůstane v rodině, ale nesplyne.
- **Web je tlumený, zemitý, papírový?** Teplá oranžová nebo jantarová.
  Na tlumeném podkladu svítí, aniž by křičela.
- **Web je tmavý?** Světlý azur nebo tyrkys. Na tmavém modrém podkladu
  je vidět i koutkem oka.
- **Web je bílý a minimalistický?** Jedna sytá barva v tenké lince.
  Plocha by na bílé ubíjela, linka ne.

Zapiš tu barvu jako proměnnou (`--navadeni`) a nikde jinde ji nepoužij.
Je to pak **slovník**: kdo ji potká potřetí, už ví, že znamená „tudy",
a nemusí mu to nikdo psát.

### Tvar podle toho, na co se ukazuje

| Cíl | Co udělat |
|---|---|
| Tlačítko nebo odkaz | tenký prstenec, který **jednou objede** obrys |
| Oblast nebo karta | měkké podsvícení zespodu, žádný rámeček |
| Pokračování textu dole | šipka pod textem, dvakrát se zhoupne a zmizí |
| Položka v seznamu | krátké projetí barvou zleva doprava |

Všechno v **nízké intenzitě**: krytí 0,5–0,8, nikdy plná plocha.
Nápověda má být vidět jako pohyb v periferním vidění, ne jako prvek
rozhraní.

### Pohyb

Jeden oběh nebo jedno zhoupnutí trvá **2–3 vteřiny**, opakuje se
nejvýš dvakrát, pak nápověda zhasne (celkem 5–6 s). Rychlejší pohyb
působí jako chyba, pomalejší si nikdo nespojí s tím, co dělal.

Prstenec kolem prvku se dá udělat bez knihovny: kuželový přechod
v `::after` + dvě masky, které vyříznou vnitřek, aby se obarvil jen
okraj a ne plocha pod textem.

```css
@property --uhel { syntax: '<angle>'; initial-value: 0deg; inherits: false }

.je-navedeno::after {
  content: ''; position: absolute; inset: -2px; border-radius: inherit;
  padding: 2px; pointer-events: none;
  background: conic-gradient(from var(--uhel),
    transparent 0deg 300deg, var(--navadeni) 345deg, transparent 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: navadeni-obeh 2.4s linear 2;
}
@keyframes navadeni-obeh { to { --uhel: 360deg } }
```

### Co se nesmí

- **`pointer-events: none` na všem, co nápověda kreslí.** Bez toho
  vrstva sebere kliknutí a člověk klikne na radu místo na cíl. Platí
  i pro prvky s `opacity: 0` — ty jsou pořád klikací.
- **Nikdy neposouvat stránku za návštěvníka.** Ani „jemně".
- **Nikdy neměnit ohnisko klávesnice.** Nápověda je pro oko; kdo
  používá klávesnici, má vlastní navigaci a skok mu ji rozbije.
- **Nespouštět nápovědu, když je člověk uprostřed něčeho** — píše do
  pole, mluví s chatem, přehrává video. Pozná se to z toho, že ten
  prvek je aktivní, ne z času.

### Přístupnost

- `prefers-reduced-motion: reduce` → **žádná animace**, jen klidné
  zabarvení. Není to volitelné; pohyb v periferii je u části lidí
  spouštěč nevolnosti.
- Nápověda nese vždycky i **význam v textu nebo struktuře**, ne jen
  barvu. Kdo barvy nerozezná, nesmí přijít o nic.
- Je-li čistě vizuální, dej jí `aria-hidden="true"`. Odečítač o délce
  textu a o možnostech ví sám a dvojí navigace ho jen zdrží.

---

## Cookiefree analytika: základ

Bez ní nepoznáš, jestli navádění k něčemu je. S cookie lištou ale
přijdeš o důvod, proč to celé stavíš.

### Pravidla, která se nesmějí porušit

1. **Žádná cookie, žádný `localStorage`, žádný identifikátor** — ani
   dočasný, ani „anonymní".
2. **Žádný otisk prohlížeče.** Unikátní návštěvníky jde měřit i bez
   cookie (denně rotovaná sůl + IP a hlavičky), ale je to otisk. Když
   web slibuje, že žádný nedělá, tohle ten slib porušuje.
3. **`Do Not Track` a `Global Privacy Control` zastaví sběr úplně** —
   a rozhodne se to **v prohlížeči**, ne na serveru. Nic neodešle.
4. **IP se použije na omezení počtu požadavků a zahodí.** Neukládá se.
5. **Žádný čas přesnější než den.**

### Tvar hlášení

Jedno na jedno zobrazení stránky, odeslané **až při odchodu**
(`visibilitychange` a `pagehide`, přes `sendBeacon` — ten odejde,
i když se karta zavírá; `beforeunload` ne, ten na mobilu nefunguje
spolehlivě).

```js
{
  s: '/cesta',        // normalizovaná cesta, bez dotazu a bez #
  j: 'cs',            // jazyk
  z: 'zvenku',        // zvenku | zevnitr | primo
  r: 'seznam.cz',     // JEN doména odkazu, nikdy celá adresa —
                      // v té bývá vyhledávaný výraz
  d: 'desktop',       // telefon | tablet | desktop
  t: 3,               // přihrádka doby na stránce, ne vteřiny
  n: [{ r: [...], u: 1 }],   // navádění: rysy + jestli pomohlo
}
```

⚠️ **Z adresy odkazu ber jen doménu.** Celá adresa od vyhledávače
obsahuje, co ten člověk hledal. To je osobní údaj, který nikdo nečekal,
že odevzdává.

⚠️ **Dobu ukládej v přihrádkách** (0–5 s, 5–15, 15–60, 60+), ne
v sekundách. Přesný čas je slabý identifikátor.

### Uložení

Denní součty, ne řada událostí. Jeden klíč na den, hodnoty se
přičítají. Z denního součtu se **jedna návštěva nedá vyzobnout**, a to
je přesně ta vlastnost, kterou chceš: nejde o to, že data nechceš
zneužít, ale že z nich nejde.

Nastav životnost (TTL) hned při zápisu — 400 dní, ať jde srovnat
sezóna. Co se maže samo, nikdo nezapomene smazat.

### Vyhodnocení navádění

Ke každé nápovědě zaznamenej, **co o té možnosti platilo** (pár čísel
0–1: jak daleko je, jak často se otevírá, jestli tam člověk už byl)
a **jestli pomohla** (klikl na to do pár vteřin). Ukládej to po
přihrádkách — rysy zaokrouhlené na pět stupňů, slepené do klíče, a
k nim počet. Z přihrádek se dá natrénovat totéž co z jednotlivých
případů, jen s váhou místo opakování.

⚠️ **Váhy nikdy nepřepisuj automaticky.** Ukaž vedle sebe, co platí
teď a co by se model z dat naučil — a přepsat to ať je rozhodnutí
člověka. Váhy rozhodují, co se komu nabídne; automat, kterému nikdo
nekouká pod ruku, se za měsíc naučí něco, co nikdo nechtěl.

A dokud není aspoň dvě stě případů, **nikde netvrď, že se to učí**.
Napiš, že je to málo.

---

## Testy, které to drží

Ne „otestovali jsme to", ale tyhle:

1. **Automat bez DOM.** Posloupnost událostí → očekávaný stav. Rychlé,
   deterministické, chytá většinu chyb.
2. **Nápověda zhasne sama.** Po `napovedaMs` není ve stavu.
3. **Počet za návštěvu a klid mezi nimi** se dodrží i při záplavě
   událostí.
4. **Nenapovídá ve stavu PŘÍCHOD a ČTE.**
5. **Zákazy se shodují s tím, co web tvrdí.** Je-li někde napsáno
   „nenavádíme k objednávce", ať test porovná ten text se seznamem
   zakázaných cílů — a shodí build, když se rozejdou. Tvrzení a kód se
   rozcházejí tiše.
6. **Hlášení neobsahuje nic, co nemá.** Test nad výstupem funkce, která
   hlášení staví: žádné id, žádná celá adresa odkazu, žádný přesný čas.

---

## Pasti, které stály hodiny

Všechny jsou z provozu. Žádná se neprojeví chybovou hláškou.

- **Práh tažení.** Rozlišuješ-li klik od tažení, nedávej práh na čtyři
  pixely. Myš se při kliknutí skoro vždy o pixel dva pohne a na
  trackpadu víc — vyhodnotí se to jako tažení, klik se potlačí a
  **nejde kliknout na nic**. Osm až deset pixelů.
- **`scroll-behavior: smooth` + ruční `scrollTop +=`.** Každé přičtení
  založí novou animaci od místa, kde se ta předchozí nachází. Při
  rychlejším kolečku to vypadá, že rolování zamrzlo. Plynule posouvej
  jen to, co si o to řekne samo (`scrollIntoView({ behavior })`).
- **Průhledný prvek bere kliknutí.** `opacity: 0` není `display: none`.
  Překryv přes půl stránky, o kterém nikdo neví, že tam je.
- **Programové ohnisko kreslí rámeček.** Když po akci nastavíš
  `focus()`, prohlížeč to bere za klávesnicové ohnisko, dokud nikdo
  nic neklikl — takže po **obnovení stránky** naskočí rámeček a jindy
  ne. Ohnisko nech (odečítač ho potřebuje), rámeček u prvku
  s `tabindex="-1"` potlač.
- **Časovač běží dál v zavřené kartě.** Nápověda pak naskočí všechny
  najednou při návratu. Zastav je na `visibilitychange`.
- **Nápověda uprostřed rozhovoru.** Spouštíš-li ji z nečinnosti, kdo
  píše do chatu taky nic nedělá. Vylučuj podle toho, co je aktivní.

---

## Pořadí prací

1. Analytika napřed, i prázdná. Bez měření se navádění ladí od oka.
2. Automat a testy. Bez DOM, bez vzhledu.
3. Jedna nápověda, jeden cíl, nejjednodušší signál (ticho po aktivitě).
4. Vzhled a barva. Teprve tady se rozhoduje o tom, jak to vypadá.
5. Další signály, po jednom, a po každém se podívej do čísel.
6. Model až tehdy, když jsou data. Možná nikdy — pět pravidel, které
   jsou vidět, bývá lepší než váhy, kterým nikdo nerozumí.

Nejčastější chyba je opačné pořadí: nejdřív efektní animace, pak
pravidla, analytika nikdy. Takové navádění vypadá dobře na snímku
obrazovky a nikdo neví, jestli k něčemu je.
