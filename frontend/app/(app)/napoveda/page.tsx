import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Nápověda — Handmade.net",
};

const CARD_BG = { background: "oklch(0.94 0.012 75)" };
const ACCENT = "oklch(0.40 0.10 196)";
const EMERALD = "oklch(0.40 0.12 155)";
const MUTED = "oklch(0.52 0.04 50)";

/** Sekce manuálu s kotvou pro odkazy z obsahu. */
function Section({
  id,
  emoji,
  title,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card className="border-0 card-mystical" style={CARD_BG}>
        <CardContent className="py-6 space-y-4">
          <h2 className="font-heading text-2xl font-light flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            {title}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
            {children}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function NapovedaPage() {
  const contents = [
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
        <h1 className="font-heading text-4xl font-light heading-accent">Nápověda</h1>
        <p className="text-muted-foreground mt-3">
          Jak Handmade.net funguje, co vám AI vrátí a jak z toho vytěžit co nejvíc.
        </p>
      </div>

      {/* Obsah */}
      <Card className="border-0 card-mystical" style={CARD_BG}>
        <CardContent className="py-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Obsah</p>
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

      <Section id="co-to-je" emoji="✦" title="Co je Handmade.net">
        <p>
          Handmade.net je <strong>optimalizační nástroj</strong> pro tvůrce, kteří prodávají ručně
          vyráběné produkty na Etsy nebo Amazon Handmade. Umělá inteligence vám pomůže napsat
          takový název, popis a klíčová slova, aby vaše zboží lidé na těchto tržištích snáz našli.
        </p>
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "oklch(0.78 0.11 196 / 0.10)", border: "1px solid oklch(0.78 0.11 196 / 0.25)" }}
        >
          <strong>Důležité:</strong> Handmade.net <strong>neprodává</strong> vaše produkty a nic za vás
          nikam nenahrává. Je to pomocník, který připraví text — ten si pak sami zkopírujete na svůj
          účet na Etsy nebo Amazonu. Prodej i peníze zůstávají plně u vás.
        </div>
      </Section>

      <Section id="jak-to-funguje" emoji="🪄" title="Jak to funguje krok za krokem">
        <ol className="space-y-3 list-none">
          {[
            {
              t: "Přidejte produkt",
              d: (
                <>
                  V sekci <Link href="/products/new" className="hover:underline" style={{ color: ACCENT }}>Nový produkt</Link>{" "}
                  vyplňte název, popis, cenu a kategorii. Rovnou můžete přidat i fotky — čím víc detailů, tím lepší výsledek.
                </>
              ),
            },
            {
              t: "Spusťte analýzu",
              d: (
                <>
                  Na detailu produktu vyberte platformu (<strong>Etsy</strong>, <strong>Amazon Handmade</strong> nebo
                  český <strong>Fler</strong>) a klikněte na <strong>Spustit analýzu</strong>. AI si produkt i fotky
                  projde a za pár vteřin vrátí výsledek. Analýzu můžete udělat pro každou platformu zvlášť —
                  <strong>všechny vám zůstanou uložené</strong> a mezi platformami se přepínáte tlačítky (u hotové
                  je fajfka ✓). Fler vrací výstup <strong>rovnou česky</strong>, Etsy a Amazon anglicky s českým překladem.
                </>
              ),
            },
            {
              t: "Zkopírujte výsledek",
              d: (
                <>
                  U každé části (název, popis, klíčová slova) je tlačítko <strong>Kopírovat</strong>.
                  Text vložíte do svého listingu na Etsy nebo Amazonu.
                </>
              ),
            },
            {
              t: "Hotovo",
              d: "Váš listing je optimalizovaný pro vyhledávání. Analýzu můžete kdykoliv spustit znovu nebo pro druhou platformu.",
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ background: "oklch(0.78 0.11 196 / 0.18)", color: "oklch(0.35 0.10 196)" }}
              >
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.t}</p>
                <p style={{ color: MUTED }}>{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="vysledek" emoji="📋" title="Co dostanete z analýzy">
        <p>Pro vybranou platformu AI vygeneruje:</p>
        <ul className="space-y-2 list-none">
          {[
            ["Optimalizovaný název", "SEO název v angličtině (jazyk tržišť) — s materiály, barvami a technikou."],
            ["Optimalizovaný popis", "Poutavý popis s klíčovými slovy, 150–300 slov."],
            ["13 klíčových slov", "Tagy pro vyhledávání, které vložíte do listingu."],
            ["Cenové doporučení", "Krátká rada k cenové strategii."],
            ["Skóre konkurenceschopnosti", "Odhad síly listingu 0–100 (viz níže)."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-2">
              <span style={{ color: EMERALD }}>▸</span>
              <span>
                <strong>{t}</strong> — <span style={{ color: MUTED }}>{d}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          Název i popis dostanete v angličtině (kvůli tržištím) a zároveň v <strong>českém překladu</strong>,
          abyste měli přehled, co text říká.
        </p>
      </Section>

      <Section id="skore" emoji="📊" title="Co znamená skóre konkurenceschopnosti">
        <p>
          Skóre (0–100) říká, jak silný váš optimalizovaný listing je. Nad 70 se zbarví zeleně jako
          „tohle je dobré". U každého skóre je štítek, který prozradí, odkud číslo pochází:
        </p>

        <div className="space-y-2">
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "oklch(0.65 0.15 155 / 0.10)", border: "1px solid oklch(0.65 0.15 155 / 0.30)" }}
          >
            <p className="font-medium" style={{ color: EMERALD }}>★ z reálného trhu (Etsy)</p>
            <p style={{ color: MUTED }}>
              Skóre je spočítané z <strong>reálné konkurence na Etsy</strong> — kolik podobných nabídek
              existuje, jak jsou naceněné a jaká klíčová slova používají. U analýzy navíc uvidíte přehled:
              počet konkurenčních nabídek, cenové rozpětí a zda vaše cena sedí do trhu. Tohle je tvrdé číslo
              opřené o data.
            </p>
          </div>

          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "oklch(0.88 0.10 85 / 0.15)", border: "1px solid oklch(0.75 0.12 80 / 0.35)" }}
          >
            <p className="font-medium" style={{ color: "oklch(0.45 0.14 75)" }}>odhad AI</p>
            <p style={{ color: MUTED }}>
              Když reálná data nejsou k dispozici (analýza pro Amazon Handmade, který veřejné vyhledávání
              nenabízí), je skóre <strong>subjektivní odhad AI</strong> z toho, co obecně ví o handmade tržištích —
              orientační ukazatel „listing je slušný / má mezery", ne přesné měření. Dvě taková čísla mezi sebou
              nemusí být přesně srovnatelná.
            </p>
          </div>
        </div>
      </Section>

      <Section id="fotky" emoji="📷" title="Fotografie produktu">
        <p>
          Fotky nejsou povinné, ale <strong>výrazně zlepšují výsledek</strong> — AI z nich rozpozná
          materiály, barvy a techniku a zapracuje je do názvu i popisu.
        </p>
        <ul className="space-y-1.5 list-none" style={{ color: MUTED }}>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> Formáty: JPG, PNG nebo WebP</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> Až 10 fotek na produkt</li>
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>▸</span>
            Velké fotky se automaticky zmenší — nemusíte je upravovat ručně, klidně nahrajte snímek přímo z mobilu
          </li>
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          Fotky přidáte buď rovnou při zakládání produktu, nebo kdykoliv později na jeho detailu.
        </p>
      </Section>

      <Section id="tipy" emoji="💡" title="Tipy pro lepší výsledky">
        <ul className="space-y-2 list-none">
          {[
            ["Pište detailně", "Čím konkrétnější původní popis (materiály, rozměry, způsob výroby, čím je kus výjimečný), tím přesnější AI výsledek."],
            ["Přidejte fotky", "AI z nich čte reálné detaily místo dohadování — výsledky jsou hmatatelnější."],
            ["Vyberte správnou kategorii", "Pomáhá AI zaměřit klíčová slova na správné publikum."],
            ["Zkuste obě platformy", "Etsy a Amazon Handmade mají jiné zvyklosti — analýzu můžete spustit pro každou zvlášť a porovnat."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-2">
              <span style={{ color: ACCENT }}>✦</span>
              <span>
                <strong>{t}</strong> — <span style={{ color: MUTED }}>{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="kvota" emoji="⏳" title="Kvóta a tarify">
        <p>
          Každý tarif má měsíční limit analýz. Aktuální stav vidíte na{" "}
          <Link href="/dashboard" className="hover:underline" style={{ color: ACCENT }}>přehledu</Link>{" "}
          a v <Link href="/profile" className="hover:underline" style={{ color: ACCENT }}>profilu</Link>.
          Čítač se každý měsíc automaticky vynuluje.
        </p>
        <ul className="space-y-1.5 list-none" style={{ color: MUTED }}>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Free</strong> — 5 analýz měsíčně</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Mini</strong> — 30 analýz měsíčně</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Midi</strong> — 150 analýz měsíčně</li>
          <li className="flex gap-2"><span style={{ color: EMERALD }}>▸</span> <strong className="text-foreground">Max</strong> — neomezeně</li>
        </ul>
        <p className="text-sm" style={{ color: MUTED }}>
          Ceny a srovnání najdete na stránce{" "}
          <Link href="/tarify" className="hover:underline" style={{ color: ACCENT }}>Tarify</Link>.
          Když analýza selže kvůli technickému problému, kvóta se vám nestrhne.
        </p>
      </Section>

      <p className="text-center text-sm text-muted-foreground pt-2">
        Nenašli jste odpověď? Napište nám a rádi poradíme.
      </p>
    </div>
  );
}
