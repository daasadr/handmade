import Link from "next/link";

export const metadata = {
  title: "Obchodní podmínky — Handmade.net",
  description: "Obchodní podmínky a zásady ochrany soukromí služby Handmade.net.",
};

const MUTED = "oklch(0.45 0.04 50)";
const ACCENT = "oklch(0.40 0.10 196)";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-xl font-normal pt-2">
        {n}. {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: MUTED }}>
        {children}
      </div>
    </section>
  );
}

export default function PodminkyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.973 0.008 80)", color: "oklch(0.22 0.04 48)" }}
    >
      <div className="max-w-3xl mx-auto px-5 py-12 space-y-6">
        <div>
          <Link href="/" className="text-sm hover:underline" style={{ color: ACCENT }}>
            ← Zpět na úvod
          </Link>
          <h1 className="font-heading text-4xl font-light mt-3">Obchodní podmínky</h1>
          <p className="text-sm mt-2" style={{ color: MUTED }}>
            a zásady ochrany soukromí služby Handmade.net · účinné od 23. 7. 2026
          </p>
        </div>

        {/* Upozornění pro provozovatele — doplnit právní údaje */}
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "oklch(0.88 0.10 85 / 0.15)", border: "1px solid oklch(0.75 0.12 80 / 0.35)" }}
        >
          <strong>⚠️ Před spuštěním doplňte:</strong> na místa označená{" "}
          <code>[DOPLŇTE …]</code> vložte skutečné údaje provozovatele (jméno / firma, IČO,
          sídlo, kontaktní e-mail). Tuto poznámku pak smažte. Doporučujeme nechat podmínky
          zkontrolovat právníkem — tohle je poctivý základ, ne právní posudek.
        </div>

        <div className="space-y-5">
          <Section n={1} title="Úvod a provozovatel">
            <p>
              Tyto obchodní podmínky upravují používání služby Handmade.net (dále jen „služba")
              dostupné na doméně handmade.net. Provozovatelem je{" "}
              <strong>[DOPLŇTE: jméno / firma, IČO, sídlo]</strong> (dále jen „provozovatel"
              nebo „my"). Registrací nebo používáním služby s těmito podmínkami souhlasíte.
            </p>
          </Section>

          <Section n={2} title="Co služba je (a co není)">
            <p>
              Handmade.net je <strong>optimalizační nástroj</strong>. Pomocí umělé inteligence
              pomáhá tvůrcům ručních výrobků vytvořit lepší názvy, popisy a klíčová slova pro
              jejich nabídky na tržištích jako Etsy, Amazon Handmade nebo Fler.
            </p>
            <p>
              Služba <strong>neprodává</strong> vaše produkty, nezprostředkovává prodej ani
              platby mezi vámi a zákazníky a nic za vás na žádné tržiště automaticky nenahrává.
              Výstupy si sami zkopírujete a použijete na svém účtu u příslušného tržiště. Prodej
              i vztah se zákazníkem zůstávají výhradně na vás.
            </p>
          </Section>

          <Section n={3} title="Uživatelský účet">
            <p>
              Pro používání služby je potřeba účet. Odpovídáte za správnost údajů a za
              zabezpečení svého hesla. Za činnost provedenou pod vaším účtem odpovídáte vy.
              Účet je určen pro vaši vlastní tvůrčí činnost.
            </p>
          </Section>

          <Section n={4} title="Tarify, platby a kvóty">
            <p>
              Služba nabízí bezplatný i placené tarify s různým měsíčním počtem AI analýz (viz{" "}
              <Link href="/tarify" className="hover:underline" style={{ color: ACCENT }}>Tarify</Link>).
              Platíte za možnost využívat naši AI optimalizaci — tedy za naši vlastní službu,
              nikoliv za data z tržišť třetích stran. Kvóta se každý měsíc obnovuje. Pokud
              analýza selže kvůli technické chybě na naší straně, do kvóty se nezapočítá.
            </p>
          </Section>

          <Section n={5} title="Výstupy AI — bez záruky výsledku">
            <p>
              Výstupy generuje jazykový model a jde o <strong>návrhy</strong>. Nezaručujeme,
              že jejich použití povede k vyšší prodejnosti, lepšímu umístění ve vyhledávání
              nebo jakémukoliv konkrétnímu obchodnímu výsledku. Skóre konkurenceschopnosti je
              orientační ukazatel. Před zveřejněním si výstupy vždy zkontrolujte — odpovědnost
              za obsah svých nabídek nesete vy.
            </p>
          </Section>

          <Section n={6} title="Váš obsah a práva">
            <p>
              Obsah, který do služby vložíte (názvy, popisy, fotografie produktů), zůstává
              váš. Udělujete nám pouze omezené oprávnění tento obsah zpracovat za účelem
              poskytnutí služby (zejména jej předat AI modelu a uložit). Optimalizované texty,
              které vám AI vygeneruje, můžete volně používat.
            </p>
          </Section>

          <Section n={7} title="Data a ochrana soukromí">
            <p>Zpracováváme a ukládáme:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li>e-mail a přihlašovací údaje (heslo pouze jako bezpečný otisk),</li>
              <li>údaje profilu (název značky, bio, profilová fotka, odkazy),</li>
              <li>vaše produkty a jejich fotografie (fotky v objektovém úložišti),</li>
              <li>výsledky AI analýz a počet využitých analýz.</li>
            </ul>
            <p>
              Data používáme výhradně k provozu služby. <strong>Neprodáváme</strong> je ani
              nesdílíme s třetími stranami s výjimkou zpracovatelů nezbytných k provozu (AI
              model pro analýzu, úložiště, e-mailová a platební služba). Pro vygenerování
              výstupu předáváme text a fotky vašeho produktu poskytovateli AI. Podrobnosti
              o zpracování včetně vašich práv najdete v{" "}
              <Link href="/gdpr" className="hover:underline" style={{ color: ACCENT }}>zásadách GDPR</Link>.
            </p>
            <p>
              O smazání účtu a souvisejících dat můžete kdykoliv požádat na kontaktním e-mailu
              níže.
            </p>
          </Section>

          <Section n={8} title="Tržiště třetích stran (Etsy, Amazon, Fler)">
            <p>
              Služba může zobrazovat informace z veřejně dostupných API těchto tržišť
              (např. přehled konkurence z Etsy). Tato data jsou vlastnictvím příslušného
              tržiště a jeho prodejců; zobrazujeme je agregovaně a{" "}
              <strong>neukládáme je natrvalo</strong> — slouží jen k okamžité představě při
              analýze. Používání každého tržiště se řídí i jeho vlastními pravidly.
            </p>
            <p className="text-xs pt-1" style={{ color: "oklch(0.55 0.03 55)" }}>
              The term „Etsy" is a trademark of Etsy, Inc. This application uses the Etsy API
              but is not endorsed or certified by Etsy, Inc.
            </p>
          </Section>

          <Section n={9} title="Zakázané používání">
            <p>
              Službu nesmíte zneužívat — zejména se pokoušet obejít bezpečnostní opatření,
              nadměrně ji zatěžovat, používat ji k nezákonným účelům nebo k porušování práv
              třetích stran. Při porušení podmínek můžeme účet omezit nebo zrušit.
            </p>
          </Section>

          <Section n={10} title="Omezení odpovědnosti">
            <p>
              Služba je poskytována „tak jak je". V rozsahu povoleném zákonem neodpovídáme za
              nepřímé škody, ušlý zisk ani za obchodní výsledky plynoucí z použití výstupů.
              Neodpovídáme za dostupnost ani pravidla tržišť třetích stran.
            </p>
          </Section>

          <Section n={11} title="Změny podmínek">
            <p>
              Podmínky můžeme aktualizovat. O podstatných změnách vás budeme informovat.
              Pokračováním v používání služby po účinnosti změn vyjadřujete souhlas s
              aktualizovaným zněním.
            </p>
          </Section>

          <Section n={12} title="Kontakt">
            <p>
              S dotazy i žádostmi o smazání dat se obraťte na{" "}
              <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>
                info@handmade.net
              </a>. Zásady zpracování osobních údajů najdete v{" "}
              <Link href="/gdpr" className="hover:underline" style={{ color: ACCENT }}>dokumentu GDPR</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
