"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

const CARD_BG = { background: "oklch(0.94 0.012 75)" };
const ACCENT = "oklch(0.40 0.10 196)";
const EMERALD = "oklch(0.40 0.12 155)";
const MUTED = "oklch(0.52 0.04 50)";

function Section({ id, emoji, title, children }: { id: string; emoji: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card className="border-0 card-mystical" style={CARD_BG}>
        <CardContent className="py-6 space-y-4">
          <h2 className="font-heading text-2xl font-light flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            {title}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/85">{children}</div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function NapovedaPage() {
  const { locale } = useLocale();
  const en = locale === "en";

  const contents = en
    ? [
        { id: "co-to-je", label: "What Handmade.net is" },
        { id: "jak-to-funguje", label: "How it works step by step" },
        { id: "vysledek", label: "What you get from an analysis" },
        { id: "skore", label: "What the score means" },
        { id: "fotky", label: "Product photos" },
        { id: "tipy", label: "Tips for better results" },
        { id: "kvota", label: "Quota and plans" },
      ]
    : [
        { id: "co-to-je", label: "Co je Handmade.net" },
        { id: "jak-to-funguje", label: "Jak to funguje krok za krokem" },
        { id: "vysledek", label: "Co dostanete z analýzy" },
        { id: "skore", label: "Co znamená skóre" },
        { id: "fotky", label: "Fotografie produktu" },
        { id: "tipy", label: "Tipy pro lepší výsledky" },
        { id: "kvota", label: "Kvóta a tarify" },
      ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-4xl font-light heading-accent">{en ? "Help" : "Nápověda"}</h1>
        <p className="text-muted-foreground mt-3">
          {en
            ? "How Handmade.net works, what the AI returns, and how to get the most out of it."
            : "Jak Handmade.net funguje, co vám AI vrátí a jak z toho vytěžit co nejvíc."}
        </p>
      </div>

      <Card className="border-0 card-mystical" style={CARD_BG}>
        <CardContent className="py-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{en ? "Contents" : "Obsah"}</p>
          <ol className="space-y-1.5 text-sm">
            {contents.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="hover:underline" style={{ color: ACCENT }}>
                  {i + 1}. {c.label}
                </a>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Section id="co-to-je" emoji="✦" title={en ? "What Handmade.net is" : "Co je Handmade.net"}>
        {en ? (
          <>
            <p>
              Handmade.net is an <strong>optimization tool</strong> for makers who sell handmade products on
              Etsy or Amazon Handmade. The AI helps you write a title, description and keywords that make your
              items easier for shoppers to find on those marketplaces.
            </p>
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.78 0.11 196 / 0.10)", border: "1px solid oklch(0.78 0.11 196 / 0.25)" }}>
              <strong>Important:</strong> Handmade.net does <strong>not</strong> sell your products and uploads
              nothing anywhere on your behalf. It prepares the text — you then copy it to your own Etsy or Amazon
              account. The sale and the money stay entirely with you.
            </div>
          </>
        ) : (
          <>
            <p>
              Handmade.net je <strong>optimalizační nástroj</strong> pro tvůrce, kteří prodávají ručně
              vyráběné produkty na Etsy nebo Amazon Handmade. Umělá inteligence vám pomůže napsat
              takový název, popis a klíčová slova, aby vaše zboží lidé na těchto tržištích snáz našli.
            </p>
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.78 0.11 196 / 0.10)", border: "1px solid oklch(0.78 0.11 196 / 0.25)" }}>
              <strong>Důležité:</strong> Handmade.net <strong>neprodává</strong> vaše produkty a nic za vás
              nikam nenahrává. Je to pomocník, který připraví text — ten si pak sami zkopírujete na svůj
              účet na Etsy nebo Amazonu. Prodej i peníze zůstávají plně u vás.
            </div>
          </>
        )}
      </Section>

      <Section id="jak-to-funguje" emoji="🪄" title={en ? "How it works step by step" : "Jak to funguje krok za krokem"}>
        <ol className="space-y-3 list-none">
          {(en
            ? [
                { t: "Add your product", d: (<>In <Link href="/products/new" className="hover:underline" style={{ color: ACCENT }}>New product</Link>, fill in the name, description, price and category. You can add photos right away — the more detail, the better the result.</>) },
                { t: "Run the analysis", d: (<>On the product detail pick a platform (<strong>Etsy</strong> or <strong>Amazon Handmade</strong>) and click <strong>Run analysis</strong>. The AI reviews your product and photos and returns a result in a few seconds. You can analyze each platform separately — <strong>all results are kept</strong> and you switch between platforms with the buttons (a done one has a ✓).</>) },
                { t: "Copy the result", d: (<>Each part (title, description, keywords) has a <strong>Copy</strong> button. Paste the text into your listing on Etsy or Amazon.</>) },
                { t: "Done", d: "Your listing is optimized for search. You can re-run the analysis anytime or run it for the other platform." },
              ]
            : [
                { t: "Přidejte produkt", d: (<>V sekci <Link href="/products/new" className="hover:underline" style={{ color: ACCENT }}>Nový produkt</Link> vyplňte název, popis, cenu a kategorii. Rovnou můžete přidat i fotky — čím víc detailů, tím lepší výsledek.</>) },
                { t: "Spusťte analýzu", d: (<>Na detailu produktu vyberte platformu (<strong>Etsy</strong>, <strong>Amazon Handmade</strong> nebo český <strong>Fler</strong>) a klikněte na <strong>Spustit analýzu</strong>. AI si produkt i fotky projde a za pár vteřin vrátí výsledek. Analýzu můžete udělat pro každou platformu zvlášť — <strong>všechny vám zůstanou uložené</strong> a mezi platformami se přepínáte tlačítky (u hotové je fajfka ✓). Fler vrací výstup <strong>rovnou česky</strong>, Etsy a Amazon anglicky s českým překladem.</>) },
                { t: "Zkopírujte výsledek", d: (<>U každé části (název, popis, klíčová slova) je tlačítko <strong>Kopírovat</strong>. Text vložíte do svého listingu na Etsy nebo Amazonu.</>) },
                { t: "Hotovo", d: "Váš listing je optimalizovaný pro vyhledávání. Analýzu můžete kdykoliv spustit znovu nebo pro druhou platformu." },
              ]
          ).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: "oklch(0.78 0.11 196 / 0.18)", color: "oklch(0.35 0.10 196)" }}>{i + 1}</span>
              <div>
                <p className="font-medium text-foreground">{step.t}</p>
                <p style={{ color: MUTED }}>{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="vysledek" emoji="📋" title={en ? "What you get from an analysis" : "Co dostanete z analýzy"}>
        <p>{en ? "For the selected platform the AI generates:" : "Pro vybranou platformu AI vygeneruje:"}</p>
        <ul className="space-y-2 list-none">
          {(en
            ? [
                ["Optimized title", "An SEO title in English — with materials, colors and technique."],
                ["Optimized description", "An engaging, keyword-rich description, 150–300 words."],
                ["Platform-specific fields", "Etsy: 13 tags (each ≤20 chars) + materials. Amazon: 5 key-feature bullets + backend search terms. Fler: Czech tags. Exactly what each marketplace asks for."],
                ["Pricing recommendation", "A short pricing-strategy tip."],
                ["Competitiveness score", "An estimate of listing strength, 0–100 (see below)."],
              ]
            : [
                ["Optimalizovaný název", "SEO název v angličtině (jazyk tržišť) — s materiály, barvami a technikou."],
                ["Optimalizovaný popis", "Poutavý popis s klíčovými slovy, 150–300 slov."],
                ["Pole na míru platformě", "Etsy: 13 tagů (každý ≤20 znaků) + materiály. Amazon: 5 hlavních bodů + skryté vyhledávací výrazy. Fler: české tagy. Přesně to, co dané tržiště vyplňuje."],
                ["Cenové doporučení", "Krátká rada k cenové strategii."],
                ["Skóre konkurenceschopnosti", "Odhad síly listingu 0–100 (viz níže)."],
              ]
          ).map(([tt, d]) => (
            <li key={tt} className="flex gap-2">
              <span style={{ color: EMERALD }}>▸</span>
              <span><strong>{tt}</strong> — <span style={{ color: MUTED }}>{d}</span></span>
            </li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          {en
            ? "In the English version the output is in English only. (In the Czech version the title and description also come with a Czech translation.)"
            : "Název i popis dostanete v angličtině (kvůli tržištím) a zároveň v "}
          {!en && <><strong>českém překladu</strong>, abyste měli přehled, co text říká.</>}
        </p>
      </Section>

      <Section id="skore" emoji="📊" title={en ? "What the competitiveness score means" : "Co znamená skóre konkurenceschopnosti"}>
        <p>
          {en
            ? "The score (0–100) tells you how strong your optimized listing is. Above 70 it turns green as \"this is good\". Each score has a label showing where the number comes from:"
            : "Skóre (0–100) říká, jak silný váš optimalizovaný listing je. Nad 70 se zbarví zeleně jako „tohle je dobré\". U každého skóre je štítek, který prozradí, odkud číslo pochází:"}
        </p>
        <div className="space-y-2">
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.65 0.15 155 / 0.10)", border: "1px solid oklch(0.65 0.15 155 / 0.30)" }}>
            <p className="font-medium" style={{ color: EMERALD }}>{en ? "★ from real market (Etsy)" : "★ z reálného trhu (Etsy)"}</p>
            <p style={{ color: MUTED }}>
              {en
                ? "The score is computed from real competition on Etsy — how many similar listings exist, how they're priced and what keywords they use. It's a hard, data-backed number. The specific current data (counts, prices, tags) is shown once during the analysis and not stored; what stays is our conclusion drawn from it for your product."
                : "Skóre je spočítané z reálné konkurence na Etsy — kolik podobných nabídek existuje, jak jsou naceněné a jaká klíčová slova používají. Tohle je tvrdé číslo opřené o data. Konkrétní aktuální data (počty, ceny, tagy) vám ukážeme jednou u analýzy a neukládáme je; natrvalo vám zůstane náš závěr, který jsme z nich vyvodili pro váš produkt."}
            </p>
          </div>
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "oklch(0.88 0.10 85 / 0.15)", border: "1px solid oklch(0.75 0.12 80 / 0.35)" }}>
            <p className="font-medium" style={{ color: "oklch(0.45 0.14 75)" }}>{en ? "AI estimate" : "odhad AI"}</p>
            <p style={{ color: MUTED }}>
              {en
                ? "When real data isn't available (an Amazon Handmade analysis — Amazon has no public search), the score is a subjective AI estimate based on what it generally knows about handmade marketplaces — an indicator of \"decent / has gaps\", not a precise measurement. Two such numbers aren't necessarily directly comparable."
                : "Když reálná data nejsou k dispozici (analýza pro Amazon Handmade, který veřejné vyhledávání nenabízí), je skóre subjektivní odhad AI z toho, co obecně ví o handmade tržištích — orientační ukazatel „listing je slušný / má mezery\", ne přesné měření. Dvě taková čísla mezi sebou nemusí být přesně srovnatelná."}
            </p>
          </div>
        </div>
      </Section>

      <Section id="fotky" emoji="📷" title={en ? "Product photos" : "Fotografie produktu"}>
        <p>
          {en
            ? "Photos are optional but significantly improve the result — the AI recognizes materials, colors and technique from them and works them into the title and description."
            : "Fotky nejsou povinné, ale výrazně zlepšují výsledek — AI z nich rozpozná materiály, barvy a techniku a zapracuje je do názvu i popisu."}
        </p>
        <ul className="space-y-1.5 list-none" style={{ color: MUTED }}>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> {en ? "Formats: JPG, PNG or WebP" : "Formáty: JPG, PNG nebo WebP"}</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> {en ? "Up to 10 photos per product" : "Až 10 fotek na produkt"}</li>
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>▸</span>
            {en ? "Large photos are resized automatically — no manual editing needed, upload straight from your phone." : "Velké fotky se automaticky zmenší — nemusíte je upravovat ručně, klidně nahrajte snímek přímo z mobilu"}
          </li>
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          {en ? "Add photos when creating the product, or anytime later on its detail page." : "Fotky přidáte buď rovnou při zakládání produktu, nebo kdykoliv později na jeho detailu."}
        </p>
      </Section>

      <Section id="tipy" emoji="💡" title={en ? "Tips for better results" : "Tipy pro lepší výsledky"}>
        <ul className="space-y-2 list-none">
          {(en
            ? [
                ["Write in detail", "The more specific your original description (materials, dimensions, how it's made, what makes the piece special), the more accurate the AI result."],
                ["Add photos", "The AI reads real detail from them instead of guessing — results are more tangible."],
                ["Pick the right category", "It helps the AI aim keywords at the right audience."],
                ["Try both platforms", "Etsy and Amazon Handmade have different conventions — run the analysis for each and compare."],
              ]
            : [
                ["Pište detailně", "Čím konkrétnější původní popis (materiály, rozměry, způsob výroby, čím je kus výjimečný), tím přesnější AI výsledek."],
                ["Přidejte fotky", "AI z nich čte reálné detaily místo dohadování — výsledky jsou hmatatelnější."],
                ["Vyberte správnou kategorii", "Pomáhá AI zaměřit klíčová slova na správné publikum."],
                ["Zkuste obě platformy", "Etsy a Amazon Handmade mají jiné zvyklosti — analýzu můžete spustit pro každou zvlášť a porovnat."],
              ]
          ).map(([tt, d]) => (
            <li key={tt} className="flex gap-2">
              <span style={{ color: ACCENT }}>✦</span>
              <span><strong>{tt}</strong> — <span style={{ color: MUTED }}>{d}</span></span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="kvota" emoji="⏳" title={en ? "Quota and plans" : "Kvóta a tarify"}>
        <p>
          {en ? "Each plan has a monthly analysis limit. You can see the current status on the " : "Každý tarif má měsíční limit analýz. Aktuální stav vidíte na "}
          <Link href="/dashboard" className="hover:underline" style={{ color: ACCENT }}>{en ? "overview" : "přehledu"}</Link>
          {en ? " and in your " : " a v "}
          <Link href="/profile" className="hover:underline" style={{ color: ACCENT }}>{en ? "profile" : "profilu"}</Link>.
          {en ? " The counter resets automatically each month." : " Čítač se každý měsíc automaticky vynuluje."}
        </p>
        <ul className="space-y-1.5 list-none" style={{ color: MUTED }}>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Free</strong> — {en ? "5 analyses/month" : "5 analýz měsíčně"}</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Mini</strong> — {en ? "30 analyses/month" : "30 analýz měsíčně"}</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Midi</strong> — {en ? "150 analyses/month" : "150 analýz měsíčně"}</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Max</strong> — {en ? "unlimited" : "neomezeně"}</li>
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          {en ? "Prices and comparison are on the " : "Ceny a srovnání najdete na stránce "}
          <Link href="/tarify" className="hover:underline" style={{ color: ACCENT }}>{en ? "Plans" : "Tarify"}</Link>
          {en ? " page. If an analysis fails due to a technical problem, your quota isn't charged." : ". Když analýza selže kvůli technickému problému, kvóta se vám nestrhne."}
        </p>
      </Section>

      <p className="text-center text-sm text-muted-foreground pt-2">
        {en ? "Didn't find an answer? Write to us and we'll gladly help." : "Nenašli jste odpověď? Napište nám a rádi poradíme."}
      </p>
    </div>
  );
}
