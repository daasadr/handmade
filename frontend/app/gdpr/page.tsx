import Link from "next/link";

export const metadata = {
  title: "Zásady zpracování osobních údajů (GDPR) — Handmade.net",
  description: "Jaké osobní údaje zpracováváme, proč, jak dlouho a jaká máte práva.",
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

export default function GdprPage() {
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
          <h1 className="font-heading text-4xl font-light mt-3">Zásady zpracování osobních údajů</h1>
          <p className="text-sm mt-2" style={{ color: MUTED }}>
            (GDPR) · služba Handmade.net · účinné od 23. 7. 2026
          </p>
        </div>

        <div className="space-y-5">
          <Section n={1} title="Správce údajů">
            <p>
              provozovatel služby Handmade.net. Kontakt:{" "}
              <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>
                info@handmade.net
              </a>.
            </p>
          </Section>

          <Section n={2} title="Jaké údaje zpracováváme">
            <ul className="space-y-1 list-disc pl-5">
              <li><strong>Identifikační a kontaktní:</strong> e-mailová adresa.</li>
              <li><strong>Přihlašovací:</strong> heslo (uložené pouze jako nevratný bezpečnostní otisk), případně identifikátor účtu Google při přihlášení přes Google.</li>
              <li><strong>Profil:</strong> název značky, bio, profilová fotka, odkazy na vaše tržiště.</li>
              <li><strong>Obsah:</strong> vaše produkty (název, popis, cena, kategorie) a jejich fotografie.</li>
              <li><strong>Údaje o užívání:</strong> počet a čas provedených AI analýz, zvolený tarif.</li>
              <li><strong>Technické:</strong> IP adresa a provozní logy serveru (pro zabezpečení a provoz).</li>
            </ul>
          </Section>

          <Section n={3} title="Účel a právní základ">
            <ul className="space-y-1 list-disc pl-5">
              <li><strong>Poskytnutí služby</strong> (účet, produkty, AI analýzy) — plnění smlouvy.</li>
              <li><strong>Zabezpečení a prevence zneužití</strong> (logy, IP) — oprávněný zájem.</li>
              <li><strong>Platby a účetnictví</strong> u placených tarifů — plnění smlouvy a právní povinnost.</li>
              <li><strong>Případná obchodní sdělení</strong> — pouze na základě vašeho souhlasu, který lze kdykoliv odvolat.</li>
            </ul>
          </Section>

          <Section n={4} title="Příjemci a zpracovatelé">
            <p>
              Údaje <strong>neprodáváme</strong>. Předáváme je pouze zpracovatelům nezbytným
              k provozu služby:
            </p>
            <ul className="space-y-1 list-disc pl-5">
              <li><strong>Anthropic (Claude AI), USA</strong> — pro vygenerování optimalizace předáváme text a fotografie vašeho produktu. Jde o předání mimo EU; probíhá na základě odpovídajících záruk (standardní smluvní doložky). <strong>[DOPLŇTE/OVĚŘTE mechanismus dle smlouvy se zpracovatelem]</strong></li>
              <li><strong>Hetzner (Německo, EU)</strong> — hosting a úložiště fotografií.</li>
              <li><strong>Resend</strong> — odesílání e-mailů (ověření, reset hesla).</li>
              <li><strong>Stripe</strong> — zpracování plateb u placených tarifů.</li>
            </ul>
            <p>
              Pro přehled konkurence dotazujeme Etsy API — <strong>nepředáváme</strong> mu přitom
              žádné vaše osobní údaje (posíláme jen klíčová slova produktu).
            </p>
          </Section>

          <Section n={5} title="Doba uchování">
            <p>
              Údaje uchováváme po dobu trvání vašeho účtu. Po zrušení účtu je smažeme, s výjimkou
              údajů, které musíme uchovat ze zákona (např. účetní doklady u plateb po zákonnou dobu).
            </p>
          </Section>

          <Section n={6} title="Vaše práva">
            <p>Ve vztahu ke svým údajům máte právo na:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li>přístup k údajům a jejich kopii,</li>
              <li>opravu nepřesných údajů,</li>
              <li>výmaz („právo být zapomenut"),</li>
              <li>omezení zpracování,</li>
              <li>přenositelnost údajů,</li>
              <li>vznesení námitky proti zpracování z oprávněného zájmu,</li>
              <li>odvolání souhlasu (tam, kde je zpracování na souhlasu založeno).</li>
            </ul>
            <p>
              Žádost uplatníte na{" "}
              <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>
                info@handmade.net
              </a>. Máte také právo podat stížnost u{" "}
              <strong>Úřadu pro ochranu osobních údajů</strong> (uoou.gov.cz).
            </p>
          </Section>

          <Section n={7} title="Cookies a místní úložiště">
            <p>
              Služba <strong>nepoužívá sledovací ani analytické cookies</strong> a nesdílí data
              s reklamními sítěmi. Ve vašem prohlížeči ukládáme pouze <strong>technicky nezbytný</strong>
              údaj — přihlašovací token (v „local storage"), díky kterému zůstáváte přihlášeni.
              Bez něj by služba nefungovala, proto nevyžaduje souhlas. Odhlášením se token smaže.
            </p>
          </Section>

          <Section n={8} title="Kontakt">
            <p>
              S čímkoliv ohledně osobních údajů se obraťte na{" "}
              <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>
                info@handmade.net
              </a>. Viz také naše{" "}
              <Link href="/podminky" className="hover:underline" style={{ color: ACCENT }}>obchodní podmínky</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
