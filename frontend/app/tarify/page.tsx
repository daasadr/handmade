import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    period: "navždy",
    desc: "Pro vyzkoušení platformy",
    limit: "5 optimalizací / měsíc",
    features: [
      "5 AI optimalizací měsíčně",
      "Etsy & Amazon Handmade",
      "Klíčová slova, popis, název",
      "Skóre konkurenceschopnosti",
      "Cenové doporučení",
    ],
    cta: "Začít zdarma",
    href: "/register",
    highlight: false,
    accentColor: "oklch(0.78 0.11 196)",
  },
  {
    id: "mini",
    name: "Mini",
    price: "9 €",
    period: "měsíčně",
    desc: "Pro aktivní výrobce",
    limit: "30 optimalizací / měsíc",
    features: [
      "30 AI optimalizací měsíčně",
      "Etsy & Amazon Handmade",
      "Klíčová slova, popis, název",
      "Skóre konkurenceschopnosti",
      "Cenové doporučení",
      "Prioritní zpracování",
    ],
    cta: "Vybrat Mini",
    href: "/register",
    highlight: true,
    accentColor: "oklch(0.72 0.13 175)",
  },
  {
    id: "midi",
    name: "Midi",
    price: "24 €",
    period: "měsíčně",
    desc: "Pro větší shoopy",
    limit: "150 optimalizací / měsíc",
    features: [
      "150 AI optimalizací měsíčně",
      "Etsy & Amazon Handmade",
      "Klíčová slova, popis, název",
      "Skóre konkurenceschopnosti",
      "Cenové doporučení",
      "Prioritní zpracování",
      "CSV export pro hromadný import",
    ],
    cta: "Vybrat Midi",
    href: "/register",
    highlight: false,
    accentColor: "oklch(0.65 0.15 155)",
  },
  {
    id: "max",
    name: "Max",
    price: "59 €",
    period: "měsíčně",
    desc: "Pro profíky a agentury",
    limit: "Neomezené optimalizace",
    features: [
      "Neomezené AI optimalizace",
      "Etsy & Amazon Handmade",
      "Klíčová slova, popis, název",
      "Skóre konkurenceschopnosti",
      "Cenové doporučení",
      "Prioritní zpracování",
      "CSV export pro hromadný import",
      "Bulk import produktů",
      "Přednostní podpora",
    ],
    cta: "Vybrat Max",
    href: "/register",
    highlight: false,
    accentColor: "oklch(0.55 0.14 145)",
  },
];

export default function TarifyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background: "oklch(0.973 0.008 80 / 0.92)", borderColor: "oklch(0.85 0.02 72)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl group-hover:scale-110 transition-transform">✦</span>
            <span className="font-heading text-lg font-medium tracking-wide" style={{ color: "oklch(0.22 0.04 48)" }}>
              handmade.net
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              style={{ color: "oklch(0.52 0.04 50)" }}>
              Přihlásit se
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}
              style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)" }}>
              Začít zdarma
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Link href="/" className="text-sm hover:opacity-70 transition-opacity mb-6 inline-block"
              style={{ color: "oklch(0.65 0.02 60)" }}>
              ← Zpět
            </Link>
            <h1 className="font-heading text-5xl sm:text-6xl font-light"
              style={{ color: "oklch(0.22 0.04 48)" }}>
              Tarify
            </h1>
            <div className="w-12 h-0.5 mx-auto mt-4 mb-6 rounded-full"
              style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
            <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.52 0.04 50)" }}>
              Začněte zdarma. Upgradujte, když budete připraveni.
              Platby brzy — zatím jsou všechny funkce dostupné.
            </p>
          </div>

          {/* Karty */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  background: plan.highlight ? "oklch(0.22 0.04 48)" : "oklch(0.94 0.012 75)",
                  boxShadow: plan.highlight ? "0 8px 32px oklch(0.22 0.04 48 / 0.2)" : "none",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white" }}>
                    Nejoblíbenější
                  </div>
                )}

                {/* Akcentní čára */}
                <div className="w-8 h-0.5 mb-4 rounded-full" style={{ background: plan.accentColor }} />

                <h2 className="font-heading text-2xl font-medium mb-1"
                  style={{ color: plan.highlight ? "oklch(0.973 0.008 80)" : "oklch(0.22 0.04 48)" }}>
                  {plan.name}
                </h2>
                <p className="text-sm mb-4"
                  style={{ color: plan.highlight ? "oklch(0.78 0.11 196)" : "oklch(0.65 0.02 60)" }}>
                  {plan.desc}
                </p>

                <div className="mb-6">
                  <span className="font-heading text-4xl font-light"
                    style={{ color: plan.highlight ? "white" : "oklch(0.22 0.04 48)" }}>
                    {plan.price}
                  </span>
                  <span className="text-sm ml-1"
                    style={{ color: plan.highlight ? "oklch(0.85 0.02 72)" : "oklch(0.65 0.02 60)" }}>
                    / {plan.period}
                  </span>
                </div>

                <div className="mb-6 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: plan.highlight ? "oklch(1 0 0 / 0.08)" : `${plan.accentColor}18`,
                    color: plan.highlight ? "oklch(0.78 0.11 196)" : plan.accentColor,
                  }}>
                  {plan.limit}
                </div>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm"
                      style={{ color: plan.highlight ? "oklch(0.88 0.01 75)" : "oklch(0.52 0.04 50)" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: plan.accentColor }}>✦</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(buttonVariants(), "w-full justify-center text-sm")}
                  style={plan.highlight
                    ? { background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }
                    : { background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)", border: "none" }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Poznámka */}
          <p className="text-center text-sm mt-10" style={{ color: "oklch(0.65 0.02 60)" }}>
            Platební brána (Stripe) bude spuštěna brzy. Do té doby jsou všechny funkce zdarma.
          </p>
        </div>
      </main>

      <footer className="border-t py-8 px-6 text-center"
        style={{ borderColor: "oklch(0.85 0.02 72)", background: "oklch(0.94 0.012 75)" }}>
        <p className="text-xs" style={{ color: "oklch(0.70 0.02 60)" }}>
          © 2026 Handmade.net · Všechna práva vyhrazena
        </p>
      </footer>
    </div>
  );
}
