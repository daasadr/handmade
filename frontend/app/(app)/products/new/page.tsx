"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  "Šperky", "Oblečení & Doplňky", "Domov & Zahrada", "Hračky & Hry",
  "Umění & Sběratelství", "Svíčky & Vonné produkty", "Papírnictví",
  "Keramika & Hrnčířství", "Textil & Tkaní", "Dřevěné výrobky", "Jiné",
];

export default function NewProductPage() {
  const [form, setForm] = useState({
    titleOriginal: "",
    descriptionOriginal: "",
    priceOriginal: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const product = await api.products.create({
        titleOriginal: form.titleOriginal,
        descriptionOriginal: form.descriptionOriginal,
        priceOriginal: form.priceOriginal ? parseFloat(form.priceOriginal) : undefined,
        category: form.category || undefined,
      });
      toast.success("Produkt byl vytvořen!");
      router.push(`/products/${product.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Vytvoření selhalo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zpět na přehled
        </Link>
        <h1 className="font-heading text-4xl font-light mt-3 heading-accent">
          Nový produkt
        </h1>
        <p className="text-muted-foreground mt-3">
          Vyplňte informace o produktu. AI pak vygeneruje optimalizovaný listing pro Etsy nebo Amazon.
        </p>
      </div>

      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-xl font-normal">Základní informace</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Název produktu *</Label>
              <Input
                id="title"
                placeholder="např. Ručně vyrobený keramický hrnek s glazurou"
                value={form.titleOriginal}
                onChange={(e) => setForm({ ...form, titleOriginal: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Původní název — AI ho optimalizuje pro vyhledávání
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Popis produktu *</Label>
              <Textarea
                id="description"
                placeholder="Popište produkt — materiály, rozměry, způsob výroby, co ho dělá výjimečným..."
                value={form.descriptionOriginal}
                onChange={(e) => setForm({ ...form, descriptionOriginal: e.target.value })}
                required
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Čím více detailů, tím lepší AI výsledek
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Cena (EUR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.priceOriginal}
                  onChange={(e) => setForm({ ...form, priceOriginal: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Kategorie</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ background: "oklch(0.97 0.008 80)", borderColor: "oklch(0.85 0.02 72)" }}
                >
                  <option value="">Vyberte kategorii</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Ukládám…" : "Uložit produkt"}
              </Button>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
                Zrušit
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
