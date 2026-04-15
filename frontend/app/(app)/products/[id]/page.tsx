"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, Product, AiOptimization } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<"etsy" | "amazon">("etsy");
  const [analyzing, setAnalyzing] = useState(false);
  const [latestOpt, setLatestOpt] = useState<AiOptimization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await api.products.get(id);
        setProduct(p);
        if (p.optimizations && p.optimizations.length > 0) {
          setLatestOpt(p.optimizations[0]);
        }
      } catch {
        toast.error("Produkt nenalezen");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await api.ai.analyze(id, platform);
      setLatestOpt(result.optimization);
      setProduct((p) => p ? { ...p, status: "analyzed" } : p);
      toast.success("AI analýza dokončena!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analýza selhala");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Opravdu smazat tento produkt?")) return;
    try {
      await api.products.delete(id);
      toast.success("Produkt smazán");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Smazání selhalo");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} zkopírováno!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zpět na přehled
        </Link>
        <div className="flex items-start justify-between mt-3 gap-4">
          <h1 className="font-heading text-3xl font-light leading-tight">
            {product.titleOriginal}
          </h1>
          <Badge
            variant="secondary"
            className="shrink-0 mt-1"
            style={{
              background: product.status === "analyzed" ? "oklch(0.55 0.12 155 / 0.15)" : "oklch(0.85 0.02 72)",
              color: product.status === "analyzed" ? "oklch(0.45 0.12 155)" : "oklch(0.52 0.04 50)",
            }}
          >
            {product.status === "draft" ? "Koncept" : product.status === "analyzed" ? "Analyzováno" : "Hotovo"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {product.category || "Bez kategorie"}
          {product.priceOriginal ? ` · ${product.priceOriginal} EUR` : ""}
        </p>
      </div>

      {/* Původní text */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal text-muted-foreground">
            Původní listing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Název</p>
            <p className="font-medium">{product.titleOriginal}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Popis</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.descriptionOriginal}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI analýza — spuštění */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal flex items-center gap-2">
            <span style={{ color: "oklch(0.78 0.11 196)" }}>✦</span> AI Optimalizace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">Platforma:</p>
            <div className="flex gap-2">
              {(["etsy", "amazon"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: platform === p ? "oklch(0.78 0.11 196)" : "oklch(0.88 0.02 72)",
                    color: platform === p ? "oklch(0.15 0.03 200)" : "oklch(0.52 0.04 50)",
                  }}
                >
                  {p === "etsy" ? "Etsy" : "Amazon Handmade"}
                </button>
              ))}
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="ml-auto"
              style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">✦</span> Analyzuji…
                </span>
              ) : latestOpt ? "Spustit znovu" : "Spustit analýzu"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Výsledek AI */}
      {latestOpt && (
        <Card className="border-0 card-mystical overflow-hidden" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardHeader style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196 / 0.12), oklch(0.65 0.15 155 / 0.12))" }}>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg font-normal">
                Optimalizovaný listing
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Skóre:</span>
                <span
                  className="font-heading text-2xl font-light"
                  style={{ color: latestOpt.competitivenessScore > 70 ? "oklch(0.55 0.12 155)" : "oklch(0.52 0.04 50)" }}
                >
                  {latestOpt.competitivenessScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {latestOpt.platform === "etsy" ? "Etsy" : "Amazon Handmade"} · Claude AI
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Název */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Optimalizovaný název</p>
                <button
                  onClick={() => copyToClipboard(latestOpt.titleOptimized, "Název")}
                  className="text-xs hover:underline"
                  style={{ color: "oklch(0.78 0.11 196)" }}
                >
                  Kopírovat
                </button>
              </div>
              <p className="font-medium leading-relaxed">{latestOpt.titleOptimized}</p>
            </div>

            <Separator />

            {/* Popis */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Optimalizovaný popis</p>
                <button
                  onClick={() => copyToClipboard(latestOpt.descriptionOptimized, "Popis")}
                  className="text-xs hover:underline"
                  style={{ color: "oklch(0.78 0.11 196)" }}
                >
                  Kopírovat
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{latestOpt.descriptionOptimized}</p>
            </div>

            <Separator />

            {/* Klíčová slova */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Klíčová slova</p>
                <button
                  onClick={() => copyToClipboard(latestOpt.keywords.join(", "), "Klíčová slova")}
                  className="text-xs hover:underline"
                  style={{ color: "oklch(0.78 0.11 196)" }}
                >
                  Kopírovat vše
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestOpt.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80"
                    style={{ background: "oklch(0.78 0.11 196 / 0.12)", color: "oklch(0.35 0.10 196)" }}
                    onClick={() => copyToClipboard(kw, `"${kw}"`)}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <Separator />

            {/* Cenové doporučení */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Cenové doporučení</p>
              <p className="text-sm leading-relaxed">{latestOpt.pricingRecommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Akce */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive/10"
        >
          Smazat produkt
        </Button>
      </div>
    </div>
  );
}
