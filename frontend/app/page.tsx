"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";

export default function LandingPage() {
  const { locale } = useLocale();
  const en = locale === "en";

  const steps = en
    ? [
        { step: "01", title: "Add your product", desc: "Enter the name, description and price as you know them. A few sentences is enough — leave the perfect wording to the AI.", color: "oklch(0.78 0.11 196)" },
        { step: "02", title: "The AI optimizes it", desc: "Claude AI analyzes your product and generates an SEO title, a keyword-rich description and a pricing tip — separately for Etsy and Amazon.", color: "oklch(0.72 0.13 175)" },
        { step: "03", title: "Copy and use", desc: "Copy the result with one click straight into your Etsy or Amazon Handmade account. Done.", color: "oklch(0.65 0.15 155)" },
      ]
    : [
        { step: "01", title: "Přidejte produkt", desc: "Vyplňte název, popis a cenu tak, jak ho znáte. Stačí pár vět — perfektní formulace necháme na AI.", color: "oklch(0.78 0.11 196)" },
        { step: "02", title: "AI ho optimalizuje", desc: "Claude AI analyzuje váš produkt a vygeneruje SEO název, popis s klíčovými slovy a cenové doporučení — zvlášť pro Etsy i Amazon.", color: "oklch(0.72 0.13 175)" },
        { step: "03", title: "Zkopírujte a použijte", desc: "Výsledek zkopírujete jedním klikem přímo do svého Etsy nebo Amazon Handmade účtu. Hotovo.", color: "oklch(0.65 0.15 155)" },
      ];

  const features = en
    ? [
        { icon: "✦", title: "SEO title", desc: "An optimized title up to 140 characters with keywords for search on Etsy and Amazon." },
        { icon: "◈", title: "Description with a story", desc: "An authentic description that engages customers and contains the words they search for." },
        { icon: "◇", title: "13 keywords", desc: "A keyword set tailored for Etsy tags or Amazon search terms. Each word is copyable." },
        { icon: "⬡", title: "Pricing strategy", desc: "A brief recommendation on how to price your product relative to the competition and market." },
        { icon: "◎", title: "Competitiveness score", desc: "A 0–100 number telling you how strong your listing is compared to others." },
        { icon: "◉", title: "Etsy and Amazon", desc: "Each platform has its own rules. We generate separately for Etsy and for Amazon Handmade." },
      ]
    : [
        { icon: "✦", title: "SEO název", desc: "Optimalizovaný název až 140 znaků s klíčovými slovy pro vyhledávání na Etsy i Amazon." },
        { icon: "◈", title: "Popis s příběhem", desc: "Autentický popis, který zaujme zákazníky a zároveň obsahuje slova, která vyhledávají." },
        { icon: "◇", title: "13 klíčových slov", desc: "Sada klíčových slov přesně pro Etsy tagy nebo Amazon search terms. Každé slovo se dá zkopírovat." },
        { icon: "⬡", title: "Cenová strategie", desc: "Stručné doporučení, jak produkt nacenit vzhledem ke konkurenci a trhu." },
        { icon: "◎", title: "Skóre konkurenceschopnosti", desc: "Číslo 0–100, které vám řekne, jak silný je váš listing oproti ostatním." },
        { icon: "◉", title: "Etsy i Amazon", desc: "Každá platforma má jiná pravidla. Generujeme zvlášť pro Etsy a zvlášť pro Amazon Handmade." },
      ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
      {/* ===== NAV ===== */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: "oklch(0.973 0.008 80 / 0.92)", borderColor: "oklch(0.85 0.02 72)", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl group-hover:scale-110 transition-transform">✦</span>
            <span className="font-heading text-lg font-medium tracking-wide" style={{ color: "oklch(0.22 0.04 48)" }}>
              handmade.net
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: "#jak-to-funguje", label: en ? "How it works" : "Jak to funguje" },
              { href: "#funkce", label: en ? "Features" : "Funkce" },
              { href: "/tarify", label: en ? "Plans" : "Tarify" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "oklch(0.52 0.04 50)" }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle className="mr-1" />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm")}
              style={{ color: "oklch(0.52 0.04 50)" }}
            >
              {en ? "Sign in" : "Přihlásit se"}
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "text-sm")}
              style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)" }}
            >
              {en ? "Start free" : "Začít zdarma"}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.12]"
              style={{ background: "radial-gradient(circle, oklch(0.78 0.11 196) 0%, transparent 65%)" }} />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-[0.10]"
              style={{ background: "radial-gradient(circle, oklch(0.65 0.15 155) 0%, transparent 65%)" }} />
            <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full opacity-[0.07]"
              style={{ background: "radial-gradient(circle, oklch(0.78 0.11 196) 0%, transparent 65%)" }} />
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
              style={{ background: "oklch(0.78 0.11 196 / 0.12)", color: "oklch(0.35 0.10 196)" }}>
              <span>✦</span>
              <span>{en ? "AI optimization for handmade makers" : "AI optimalizace pro handmade výrobce"}</span>
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-light leading-tight"
              style={{ color: "oklch(0.22 0.04 48)" }}>
              {en ? "Your product " : "Váš produkt si "}
              <span className="italic" style={{
                background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {en ? "deserves to be found" : "zaslouží být nalezen"}
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
              style={{ color: "oklch(0.52 0.04 50)" }}>
              {en
                ? "Add a product and the AI generates an optimized title, description and keywords for Etsy and Amazon Handmade. More customers. Less time writing."
                : "Nahrajte produkt, AI vygeneruje optimalizovaný název, popis a klíčová slova pro Etsy i Amazon Handmade. Více zákazníků. Méně času s psaním."}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className={cn(buttonVariants(), "h-12 px-8 text-base")}
                style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }}
              >
                {en ? "Start free — 5 optimizations/month" : "Začít zdarma — 5 optimalizací/měsíc"}
              </Link>
              <a
                href="#jak-to-funguje"
                className={cn(buttonVariants({ variant: "outline" }), "h-12 px-8 text-base")}
                style={{ borderColor: "oklch(0.85 0.02 72)", color: "oklch(0.52 0.04 50)" }}
              >
                {en ? "How it works ↓" : "Jak to funguje ↓"}
              </a>
            </div>

            <p className="mt-4 text-sm" style={{ color: "oklch(0.65 0.02 60)" }}>
              {en ? "No credit card · Free tier forever" : "Bez kreditní karty · Free tier navždy"}
            </p>
          </div>
        </section>

        {/* ===== PLATFORMY ===== */}
        <section className="py-10 border-y" style={{ borderColor: "oklch(0.88 0.015 74)" }}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-sm font-medium uppercase tracking-widest mb-6"
              style={{ color: "oklch(0.65 0.02 60)" }}>
              {en ? "We optimize listings for" : "Optimalizujeme listingy pro"}
            </p>
            <div className="flex items-center justify-center gap-12">
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-medium" style={{ color: "oklch(0.55 0.13 45)" }}>
                  etsy
                </span>
              </div>
              <div className="w-px h-6" style={{ background: "oklch(0.85 0.02 72)" }} />
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-medium" style={{ color: "oklch(0.35 0.06 196)" }}>
                  Amazon Handmade
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== JAK TO FUNGUJE ===== */}
        <section id="jak-to-funguje" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl sm:text-5xl font-light"
                style={{ color: "oklch(0.22 0.04 48)" }}>
                {en ? "Three steps to better sales" : "Tři kroky ke lepším prodejům"}
              </h2>
              <div className="w-12 h-0.5 mx-auto mt-4 rounded-full"
                style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((item) => (
                <div key={item.step} className="relative p-8 rounded-2xl card-mystical"
                  style={{ background: "oklch(0.94 0.012 75)" }}>
                  <div className="font-heading text-5xl font-light mb-4 opacity-20"
                    style={{ color: item.color }}>
                    {item.step}
                  </div>
                  <div className="w-8 h-0.5 mb-4 rounded-full"
                    style={{ background: item.color }} />
                  <h3 className="font-heading text-xl font-medium mb-3"
                    style={{ color: "oklch(0.22 0.04 48)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.52 0.04 50)" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FUNKCE ===== */}
        <section id="funkce" className="py-24 px-6"
          style={{ background: "oklch(0.94 0.012 75)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading text-4xl sm:text-5xl font-light"
                style={{ color: "oklch(0.22 0.04 48)" }}>
                {en ? "What you get" : "Co dostanete"}
              </h2>
              <div className="w-12 h-0.5 mx-auto mt-4 rounded-full"
                style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="p-6 rounded-2xl"
                  style={{ background: "oklch(0.973 0.008 80)" }}>
                  <div className="text-2xl mb-3" style={{ color: "oklch(0.78 0.11 196)" }}>
                    {f.icon}
                  </div>
                  <h3 className="font-heading text-lg font-medium mb-2"
                    style={{ color: "oklch(0.22 0.04 48)" }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.52 0.04 50)" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== BOTTOM CTA ===== */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.08]"
              style={{ background: "radial-gradient(ellipse, oklch(0.78 0.11 196) 0%, transparent 70%)" }} />
          </div>
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-4xl sm:text-5xl font-light mb-6"
              style={{ color: "oklch(0.22 0.04 48)" }}>
              {en ? "Get started today" : "Začněte ještě dnes"}
            </h2>
            <p className="text-lg mb-10" style={{ color: "oklch(0.52 0.04 50)" }}>
              {en ? "5 free optimizations every month. No credit card." : "5 optimalizací zdarma každý měsíc. Bez kreditní karty."}
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants(), "h-12 px-10 text-base")}
              style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }}
            >
              {en ? "Create a free account" : "Vytvořit bezplatný účet"}
            </Link>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-10 px-6"
        style={{ borderColor: "oklch(0.85 0.02 72)", background: "oklch(0.94 0.012 75)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <span className="font-heading text-base" style={{ color: "oklch(0.52 0.04 50)" }}>
              handmade.net
            </span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[
              { href: "/tarify", label: en ? "Plans" : "Tarify" },
              { href: "/podminky", label: en ? "Terms" : "Obchodní podmínky" },
              { href: "/gdpr", label: en ? "Privacy" : "GDPR" },
              { href: "mailto:info@handmade.net", label: en ? "Contact" : "Kontakt" },
              { href: "/login", label: en ? "Sign in" : "Přihlásit se" },
              { href: "/register", label: en ? "Sign up" : "Registrace" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: "oklch(0.65 0.02 60)" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "oklch(0.70 0.02 60)" }}>
            © 2026 Handmade.net
          </p>
        </div>
        <p className="max-w-6xl mx-auto mt-6 text-[11px] text-center" style={{ color: "oklch(0.72 0.02 60)" }}>
          The term „Etsy" is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.
        </p>
      </footer>
    </div>
  );
}
