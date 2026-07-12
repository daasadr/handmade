"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "0 Kč",
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
    highlight: false,
    accentColor: "oklch(0.78 0.11 196)",
  },
  {
    id: "mini" as const,
    name: "Mini",
    price: "199 Kč",
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
    highlight: true,
    accentColor: "oklch(0.72 0.13 175)",
  },
  {
    id: "midi" as const,
    name: "Midi",
    price: "599 Kč",
    period: "měsíčně",
    desc: "Pro větší shopy",
    limit: "150 optimalizací / měsíc",
    features: [
      "150 AI optimalizací měsíčně",
      "Etsy & Amazon Handmade",
      "Klíčová slova, popis, název",
      "Skóre konkurenceschopnosti",
      "Cenové doporučení",
      "Prioritní zpracování",
      "CSV export",
    ],
    cta: "Vybrat Midi",
    highlight: false,
    accentColor: "oklch(0.65 0.15 155)",
  },
  {
    id: "max" as const,
    name: "Max",
    price: "1 499 Kč",
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
      "CSV export",
      "Bulk import produktů",
      "Přednostní podpora",
    ],
    cta: "Vybrat Max",
    highlight: false,
    accentColor: "oklch(0.55 0.14 145)",
  },
];

export default function TarifyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: "mini" | "midi" | "max") => {
    if (!user) {
      window.location.href = "/register";
      return;
    }
    setLoading(planId);
    try {
      const { url } = await api.billing.createCheckout(planId);
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chyba při vytváření platby");
      setLoading(null);
    }
  };

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
            {user ? (
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Přehled
              </Link>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  style={{ color: "oklch(0.52 0.04 50)" }}>
                  Přihlásit se
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}
                  style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)" }}>
                  Začít zdarma
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Link href={user ? "/dashboard" : "/"} className="text-sm hover:opacity-70 transition-opacity mb-6 inline-block"
              style={{ color: "oklch(0.65 0.02 60)" }}>
              ← Zpět
            </Link>
            <h1 className="font-heading text-5xl sm:text-6xl font-light" style={{ color: "oklch(0.22 0.04 48)" }}>
              Tarify
            </h1>
            <div className="w-12 h-0.5 mx-auto mt-4 mb-6 rounded-full"
              style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
            <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.52 0.04 50)" }}>
              Začněte zdarma. Upgradujte, když budete připraveni.
            </p>
            {user && (
              <p className="text-sm mt-2" style={{ color: "oklch(0.65 0.04 155)" }}>
                Aktuální plán: <strong>{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</strong>
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => {
              const isCurrent = user?.plan === plan.id;
              const isPaid = plan.id !== "free";

              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={{
                    background: plan.highlight ? "oklch(0.22 0.04 48)" : "oklch(0.94 0.012 75)",
                    boxShadow: plan.highlight ? "0 8px 32px oklch(0.22 0.04 48 / 0.2)" : "none",
                    outline: isCurrent ? `2px solid ${plan.accentColor}` : "none",
                  }}
                >
                  {plan.highlight && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white" }}>
                      Nejoblíbenější
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: plan.accentColor, color: "white" }}>
                      Váš plán
                    </div>
                  )}

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

                  {isCurrent ? (
                    <div className={cn(buttonVariants(), "w-full justify-center text-sm opacity-60 cursor-default")}
                      style={{ background: plan.accentColor, color: "white", border: "none" }}>
                      Aktivní plán
                    </div>
                  ) : plan.id === "free" ? (
                    <Link href={user ? "/dashboard" : "/register"}
                      className={cn(buttonVariants(), "w-full justify-center text-sm")}
                      style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)", border: "none" }}>
                      {user ? "Přejít na přehled" : "Začít zdarma"}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loading === plan.id}
                      className={cn(buttonVariants(), "w-full justify-center text-sm disabled:opacity-60")}
                      style={plan.highlight
                        ? { background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }
                        : { background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)", border: "none" }
                      }
                    >
                      {loading === plan.id ? "Přesměrovávám…" : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm mt-10" style={{ color: "oklch(0.65 0.02 60)" }}>
            Bezpečné platby přes Stripe · Zrušit lze kdykoliv
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
