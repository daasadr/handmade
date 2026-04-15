"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, Product } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Koncept", color: "oklch(0.52 0.04 50)" },
  analyzed: { label: "Analyzováno", color: "oklch(0.55 0.12 155)" },
  completed: { label: "Hotovo", color: "oklch(0.40 0.10 196)" },
};

const PLAN_LIMITS: Record<string, number> = {
  free: 5, mini: 30, midi: 150, max: 99999,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await api.makers.getProfile();
        setHasProfile(true);
        const prods = await api.products.list();
        setProducts(prods);
      } catch {
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const limit = PLAN_LIMITS[user?.plan || "free"];
  const usage = user?.aiUsageThisMonth || 0;
  const usagePct = Math.min((usage / limit) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Uvítání */}
      <div>
        <h1 className="font-heading text-4xl font-light heading-accent">
          Dobrý den
        </h1>
        <p className="text-muted-foreground mt-3">
          {user?.email}
        </p>
      </div>

      {/* Chybí profil */}
      {hasProfile === false && (
        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardContent className="py-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Dokončete svůj profil</p>
              <p className="text-sm text-muted-foreground mt-1">
                Přidejte název značky a bio, aby bylo vaše studio kompletní.
              </p>
            </div>
            <Link href="/profile" className={cn(buttonVariants({ size: "sm" }))}>
              Vytvořit profil
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-normal text-muted-foreground">
              Produkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-light">{products.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-normal text-muted-foreground">
              AI optimalizace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-light">
              {products.filter((p) => p.status === "analyzed" || p.status === "completed").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-normal text-muted-foreground">
              Kvóta tento měsíc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-light">
              {usage}
              <span className="text-lg text-muted-foreground font-sans font-light">
                /{limit === 99999 ? "∞" : limit}
              </span>
            </p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.85 0.02 72)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct > 80
                    ? "oklch(0.577 0.245 27.325)"
                    : "linear-gradient(to right, oklch(0.78 0.11 196), oklch(0.65 0.15 155))",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produkty */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-2xl font-light">Vaše produkty</h2>
          <Link href="/products/new" className={cn(buttonVariants({ size: "sm" }))}>
            + Přidat produkt
          </Link>
        </div>

        {products.length === 0 ? (
          <Card className="border-dashed border-2" style={{ borderColor: "oklch(0.85 0.02 72)", background: "transparent" }}>
            <CardContent className="py-16 text-center">
              <p className="text-3xl mb-3">✦</p>
              <p className="font-heading text-xl font-light text-muted-foreground">
                Zatím žádné produkty
              </p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Přidejte svůj první produkt a nechte AI ho optimalizovat.
              </p>
              <Link href="/products/new" className={cn(buttonVariants())}>
                Přidat první produkt
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {products.map((product) => {
              const s = STATUS_LABELS[product.status];
              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card
                    className="border-0 card-mystical hover:shadow-md transition-shadow cursor-pointer"
                    style={{ background: "oklch(0.94 0.012 75)" }}
                  >
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.titleOriginal}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {product.category || "Bez kategorie"}
                          {product.priceOriginal ? ` · ${product.priceOriginal} EUR` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                        style={{ background: `${s.color}18`, color: s.color }}
                      >
                        {s.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
