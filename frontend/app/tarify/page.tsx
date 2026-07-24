"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";

export default function TarifyPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const en = locale === "en";
  const [loading, setLoading] = useState<string | null>(null);

  // Ceny zůstávají v Kč — měna pro zahraničí je obchodní rozhodnutí na později.
  const PLANS = [
    {
      id: "free" as const,
      name: "Free",
      price: "0 Kč",
      period: en ? "forever" : "navždy",
      desc: en ? "To try the platform" : "Pro vyzkoušení platformy",
      limit: en ? "5 optimizations / month" : "5 optimalizací / měsíc",
      features: en
        ? ["5 AI optimizations per month", "Etsy & Amazon Handmade", "Keywords, description, title", "Competitiveness score", "Pricing recommendation"]
        : ["5 AI optimalizací měsíčně", "Etsy & Amazon Handmade", "Klíčová slova, popis, název", "Skóre konkurenceschopnosti", "Cenové doporučení"],
      cta: en ? "Start free" : "Začít zdarma",
      highlight: false,
      accentColor: "oklch(0.78 0.11 196)",
    },
    {
      id: "mini" as const,
      name: "Mini",
      price: "199 Kč",
      period: en ? "per month" : "měsíčně",
      desc: en ? "For active makers" : "Pro aktivní výrobce",
      limit: en ? "30 optimizations / month" : "30 optimalizací / měsíc",
      features: en
        ? ["30 AI optimizations per month", "Etsy & Amazon Handmade", "Keywords, description, title", "Competitiveness score", "Pricing recommendation", "Priority processing"]
        : ["30 AI optimalizací měsíčně", "Etsy & Amazon Handmade", "Klíčová slova, popis, název", "Skóre konkurenceschopnosti", "Cenové doporučení", "Prioritní zpracování"],
      cta: en ? "Choose Mini" : "Vybrat Mini",
      highlight: true,
      accentColor: "oklch(0.72 0.13 175)",
    },
    {
      id: "midi" as const,
      name: "Midi",
      price: "599 Kč",
      period: en ? "per month" : "měsíčně",
      desc: en ? "For bigger shops" : "Pro větší shopy",
      limit: en ? "150 optimizations / month" : "150 optimalizací / měsíc",
      features: en
        ? ["150 AI optimizations per month", "Etsy & Amazon Handmade", "Keywords, description, title", "Competitiveness score", "Pricing recommendation", "Priority processing", "CSV export"]
        : ["150 AI optimalizací měsíčně", "Etsy & Amazon Handmade", "Klíčová slova, popis, název", "Skóre konkurenceschopnosti", "Cenové doporučení", "Prioritní zpracování", "CSV export"],
      cta: en ? "Choose Midi" : "Vybrat Midi",
      highlight: false,
      accentColor: "oklch(0.65 0.15 155)",
    },
    {
      id: "max" as const,
      name: "Max",
      price: "1 499 Kč",
      period: en ? "per month" : "měsíčně",
      desc: en ? "For pros and agencies" : "Pro profíky a agentury",
      limit: en ? "Unlimited optimizations" : "Neomezené optimalizace",
      features: en
        ? ["Unlimited AI optimizations", "Etsy & Amazon Handmade", "Keywords, description, title", "Competitiveness score", "Pricing recommendation", "Priority processing", "CSV export", "Bulk product import", "Priority support"]
        : ["Neomezené AI optimalizace", "Etsy & Amazon Handmade", "Klíčová slova, popis, název", "Skóre konkurenceschopnosti", "Cenové doporučení", "Prioritní zpracování", "CSV export", "Bulk import produktů", "Přednostní podpora"],
      cta: en ? "Choose Max" : "Vybrat Max",
      highlight: false,
      accentColor: "oklch(0.55 0.14 145)",
    },
  ];

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
      toast.error(err instanceof Error ? err.message : (en ? "Payment error" : "Chyba při vytváření platby"));
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
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
            <LangToggle className="mr-1" />
            {user ? (
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                {en ? "Overview" : "Přehled"}
              </Link>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  style={{ color: "oklch(0.52 0.04 50)" }}>
                  {en ? "Sign in" : "Přihlásit se"}
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}
                  style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)" }}>
                  {en ? "Start free" : "Začít zdarma"}
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
              {en ? "← Back" : "← Zpět"}
            </Link>
            <h1 className="font-heading text-5xl sm:text-6xl font-light" style={{ color: "oklch(0.22 0.04 48)" }}>
              {en ? "Plans" : "Tarify"}
            </h1>
            <div className="w-12 h-0.5 mx-auto mt-4 mb-6 rounded-full"
              style={{ background: "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))" }} />
            <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.52 0.04 50)" }}>
              {en ? "Start free. Upgrade when you're ready." : "Začněte zdarma. Upgradujte, když budete připraveni."}
            </p>
            {user && (
              <p className="text-sm mt-2" style={{ color: "oklch(0.65 0.04 155)" }}>
                {en ? "Current plan: " : "Aktuální plán: "}
                <strong>{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</strong>
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => {
              const isCurrent = user?.plan === plan.id;

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
                      {en ? "Most popular" : "Nejoblíbenější"}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: plan.accentColor, color: "white" }}>
                      {en ? "Your plan" : "Váš plán"}
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
                      {en ? "Active plan" : "Aktivní plán"}
                    </div>
                  ) : plan.id === "free" ? (
                    <Link href={user ? "/dashboard" : "/register"}
                      className={cn(buttonVariants(), "w-full justify-center text-sm")}
                      style={{ background: "oklch(0.22 0.04 48)", color: "oklch(0.973 0.008 80)", border: "none" }}>
                      {user ? (en ? "Go to overview" : "Přejít na přehled") : (en ? "Start free" : "Začít zdarma")}
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
                      {loading === plan.id ? (en ? "Redirecting…" : "Přesměrovávám…") : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm mt-10" style={{ color: "oklch(0.65 0.02 60)" }}>
            {en ? "Secure payments via Stripe · Cancel anytime" : "Bezpečné platby přes Stripe · Zrušit lze kdykoliv"}
          </p>
        </div>
      </main>

      <footer className="border-t py-8 px-6 text-center"
        style={{ borderColor: "oklch(0.85 0.02 72)", background: "oklch(0.94 0.012 75)" }}>
        <p className="text-xs" style={{ color: "oklch(0.70 0.02 60)" }}>
          © 2026 Handmade.net · {en ? "All rights reserved" : "Všechna práva vyhrazena"}
        </p>
      </footer>
    </div>
  );
}
