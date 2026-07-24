"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

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
  const { locale } = useLocale();
  const en = locale === "en";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.973 0.008 80)", color: "oklch(0.22 0.04 48)" }}>
      <div className="max-w-3xl mx-auto px-5 py-12 space-y-6">
        <div>
          <Link href="/" className="text-sm hover:underline" style={{ color: ACCENT }}>
            {en ? "← Back to home" : "← Zpět na úvod"}
          </Link>
          <h1 className="font-heading text-4xl font-light mt-3">
            {en ? "Privacy Policy" : "Zásady zpracování osobních údajů"}
          </h1>
          <p className="text-sm mt-2" style={{ color: MUTED }}>
            {en
              ? "GDPR & US state privacy · Handmade.net · effective 23 July 2026"
              : "(GDPR) · služba Handmade.net · účinné od 23. 7. 2026"}
          </p>
        </div>

        {en ? (
          // ===================== ENGLISH (GDPR + US) =====================
          <div className="space-y-5">
            <Section n={1} title="Data controller">
              <p>
                The controller is the operator of Handmade.net, established in the European Union. Contact:{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
              </p>
            </Section>

            <Section n={2} title="Data we process">
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Identity/contact:</strong> email address.</li>
                <li><strong>Login:</strong> password (stored only as an irreversible hash), or a Google account identifier if you sign in with Google.</li>
                <li><strong>Profile:</strong> brand name, bio, profile photo, links to your marketplaces.</li>
                <li><strong>Content:</strong> your products (title, description, price, category) and their photos.</li>
                <li><strong>Usage:</strong> number and time of AI analyses, chosen plan.</li>
                <li><strong>Technical:</strong> IP address and server logs (for security and operation).</li>
              </ul>
            </Section>

            <Section n={3} title="Purpose and legal basis (GDPR)">
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Providing the Service</strong> (account, products, AI analyses) — performance of a contract.</li>
                <li><strong>Security and abuse prevention</strong> (logs, IP) — legitimate interest.</li>
                <li><strong>Payments and accounting</strong> for paid plans — contract and legal obligation.</li>
                <li><strong>Any marketing</strong> — only with your consent, which you can withdraw at any time.</li>
              </ul>
            </Section>

            <Section n={4} title="Recipients and processors">
              <p>We do <strong>not</strong> sell your data. We share it only with processors needed to run the Service:</p>
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Anthropic (Claude AI), USA</strong> — to generate optimization we send your product text and photos. This is a transfer outside the EU, made under appropriate safeguards (Standard Contractual Clauses).</li>
                <li><strong>Hetzner (Germany, EU)</strong> — hosting and photo storage.</li>
                <li><strong>Resend</strong> — sending email (verification, password reset).</li>
                <li><strong>Stripe</strong> — payment processing for paid plans.</li>
              </ul>
              <p>For the competition overview we query the Etsy API — we do <strong>not</strong> send it any of your personal data (only product keywords).</p>
            </Section>

            <Section n={5} title="Retention">
              <p>
                We keep your data for the life of your account. After you close it we delete the data, except
                what we must retain by law (e.g. accounting records for payments for the statutory period).
              </p>
            </Section>

            <Section n={6} title="Your rights (EU / GDPR)">
              <p>You have the right to access, rectification, erasure (&quot;right to be forgotten&quot;), restriction,
                data portability, objection to processing based on legitimate interest, and withdrawal of consent.
                Exercise them at{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
                You may also lodge a complaint with your supervisory authority (in the Czech Republic, the Office
                for Personal Data Protection, uoou.gov.cz).
              </p>
            </Section>

            <Section n={7} title="US residents (California and other states)">
              <p>
                If you are a US resident, applicable state privacy laws (such as the California Consumer Privacy
                Act, CCPA/CPRA) give you the right to know what personal information we collect, to request its
                deletion, and to correct it. We do <strong>not</strong> sell or &quot;share&quot; your personal
                information for cross-context behavioral advertising, and we do not use tracking or advertising
                cookies. To exercise these rights, contact{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>{" "}
                — we will not discriminate against you for doing so. Note that, as described above, some data is
                processed in the United States by our AI provider.
              </p>
            </Section>

            <Section n={8} title="Cookies and local storage">
              <p>
                The Service uses <strong>no tracking or analytics cookies</strong> and shares no data with ad
                networks. In your browser we store only a <strong>strictly necessary</strong> login token (in
                &quot;local storage&quot;) that keeps you signed in. The Service can&apos;t work without it, so it
                requires no consent. Logging out clears it.
              </p>
            </Section>

            <Section n={9} title="Contact">
              <p>
                For anything regarding personal data, contact{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
                See also our{" "}
                <Link href="/podminky" className="hover:underline" style={{ color: ACCENT }}>Terms of Service</Link>.
              </p>
            </Section>
          </div>
        ) : (
          // ===================== ČESKY =====================
          <div className="space-y-5">
            <Section n={1} title="Správce údajů">
              <p>
                Správcem osobních údajů je provozovatel služby Handmade.net se sídlem v Evropské unii.
                Kontakt:{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
              </p>
            </Section>

            <Section n={2} title="Jaké údaje zpracováváme">
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Identifikační a kontaktní:</strong> e-mailová adresa.</li>
                <li><strong>Přihlašovací:</strong> heslo (uložené pouze jako nevratný bezpečnostní otisk), případně identifikátor účtu Google.</li>
                <li><strong>Profil:</strong> název značky, bio, profilová fotka, odkazy na vaše tržiště.</li>
                <li><strong>Obsah:</strong> vaše produkty (název, popis, cena, kategorie) a jejich fotografie.</li>
                <li><strong>Údaje o užívání:</strong> počet a čas provedených AI analýz, zvolený tarif.</li>
                <li><strong>Technické:</strong> IP adresa a provozní logy serveru.</li>
              </ul>
            </Section>

            <Section n={3} title="Účel a právní základ">
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Poskytnutí služby</strong> (účet, produkty, AI analýzy) — plnění smlouvy.</li>
                <li><strong>Zabezpečení a prevence zneužití</strong> (logy, IP) — oprávněný zájem.</li>
                <li><strong>Platby a účetnictví</strong> u placených tarifů — plnění smlouvy a právní povinnost.</li>
                <li><strong>Případná obchodní sdělení</strong> — pouze na základě vašeho souhlasu.</li>
              </ul>
            </Section>

            <Section n={4} title="Příjemci a zpracovatelé">
              <p>Údaje <strong>neprodáváme</strong>. Předáváme je pouze zpracovatelům nezbytným k provozu:</p>
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Anthropic (Claude AI), USA</strong> — pro vygenerování optimalizace předáváme text a fotografie vašeho produktu. Jde o předání mimo EU na základě odpovídajících záruk (standardní smluvní doložky).</li>
                <li><strong>Hetzner (Německo, EU)</strong> — hosting a úložiště fotografií.</li>
                <li><strong>Resend</strong> — odesílání e-mailů.</li>
                <li><strong>Stripe</strong> — zpracování plateb.</li>
              </ul>
              <p>Pro přehled konkurence dotazujeme Etsy API — <strong>nepředáváme</strong> mu žádné vaše osobní údaje (jen klíčová slova produktu).</p>
            </Section>

            <Section n={5} title="Doba uchování">
              <p>
                Údaje uchováváme po dobu trvání účtu. Po zrušení účtu je smažeme, s výjimkou údajů, které
                musíme uchovat ze zákona (např. účetní doklady po zákonnou dobu).
              </p>
            </Section>

            <Section n={6} title="Vaše práva">
              <p>
                Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost, vznesení námitky a
                odvolání souhlasu. Žádost uplatníte na{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
                Máte také právo podat stížnost u <strong>Úřadu pro ochranu osobních údajů</strong> (uoou.gov.cz).
              </p>
            </Section>

            <Section n={7} title="Cookies a místní úložiště">
              <p>
                Služba <strong>nepoužívá sledovací ani analytické cookies</strong>. Ve vašem prohlížeči ukládáme
                pouze <strong>technicky nezbytný</strong> přihlašovací token (v „local storage"), díky kterému
                zůstáváte přihlášeni. Bez něj by služba nefungovala, proto nevyžaduje souhlas.
              </p>
            </Section>

            <Section n={8} title="Kontakt">
              <p>
                S čímkoliv ohledně osobních údajů se obraťte na{" "}
                <a href="mailto:info@handmade.net" className="hover:underline" style={{ color: ACCENT }}>info@handmade.net</a>.
                Viz také naše{" "}
                <Link href="/podminky" className="hover:underline" style={{ color: ACCENT }}>obchodní podmínky</Link>.
              </p>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
