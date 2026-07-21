"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { prepareImages, formatBytes, IMAGE_LIMITS } from "@/lib/image-upload";
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
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  // Fotky se komprimují hned při výběru, aby uživatel viděl náhled a odeslání
  // formuláře pak bylo rychlé. Nahrají se až po vytvoření produktu — endpoint
  // pro upload potřebuje jeho ID.
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    api.makers.getProfile()
      .then(() => { setHasProfile(true); setProfileChecked(true); })
      .catch(() => { setHasProfile(false); setProfileChecked(true); });
  }, []);

  // Náhledy drží objectURL — bez uvolnění by při odchodu ze stránky zůstaly v paměti.
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!selected.length) return;

    const free = IMAGE_LIMITS.maxFiles - images.length;
    if (free <= 0) {
      toast.error(`K produktu lze přidat nejvýš ${IMAGE_LIMITS.maxFiles} fotek.`);
      return;
    }
    if (selected.length > free) {
      toast.error(`Přidat lze ještě ${free} ${free === 1 ? "fotku" : "fotky"} — zbytek jsme vynechali.`);
    }

    setCompressing(true);
    try {
      const { files, errors, originalBytes, compressedBytes } = await prepareImages(
        selected.slice(0, free),
      );
      errors.forEach((msg) => toast.error(msg));
      if (!files.length) return;

      setImages((prev) => [
        ...prev,
        ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ]);

      const saved = originalBytes - compressedBytes;
      if (saved > 0) toast.success(`Fotky připraveny — zmenšeno o ${formatBytes(saved)}.`);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let productId: string;
    try {
      const product = await api.products.create({
        titleOriginal: form.titleOriginal,
        descriptionOriginal: form.descriptionOriginal,
        priceOriginal: form.priceOriginal ? parseFloat(form.priceOriginal) : undefined,
        category: form.category || undefined,
      });
      productId = product.id;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Vytvoření selhalo");
      setLoading(false);
      return;
    }

    // Produkt už existuje. Když upload fotek selže, nepovažujeme to za selhání
    // celého uložení — uživatele pustíme na detail, kde je může přidat znovu.
    if (images.length) {
      try {
        await api.products.uploadImages(productId, images.map((img) => img.file));
        toast.success("Produkt byl vytvořen i s fotkami!");
      } catch (err: unknown) {
        toast.error(
          `Produkt byl uložen, ale fotky se nepodařilo nahrát: ${
            err instanceof Error ? err.message : "neznámá chyba"
          } Zkuste je prosím přidat na detailu produktu.`,
        );
      }
    } else {
      toast.success("Produkt byl vytvořen!");
    }

    router.push(`/products/${productId}`);
  };

  if (!profileChecked) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Zpět na přehled
          </Link>
          <h1 className="font-heading text-4xl font-light mt-3 heading-accent">
            Nový produkt
          </h1>
        </div>

        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-3xl">✦</p>
            <p className="font-heading text-xl font-light">Nejdřív vyplňte profil</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Před přidáním produktů je potřeba vyplnit základní informace o vašem studiu — název značky a bio.
            </p>
            <Link href="/profile/edit" className={cn(buttonVariants(), "mt-2")}>
              Vytvořit profil
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

            <div className="space-y-1.5">
              <Label>Fotografie produktu</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleSelectImages}
              />

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pb-1">
                  {images.map((img, i) => (
                    <div key={img.preview} className="relative group aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt={`Náhled ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "oklch(0.22 0.04 48 / 0.75)", color: "white" }}
                        title="Odebrat fotku"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing || images.length >= IMAGE_LIMITS.maxFiles}
                className="w-full border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-1 transition-all hover:border-current disabled:opacity-50"
                style={{ borderColor: "oklch(0.80 0.04 72)", color: "oklch(0.65 0.04 50)" }}
              >
                <span className="text-xl">📷</span>
                <span className="text-sm">
                  {compressing
                    ? "Připravuji fotky…"
                    : images.length
                      ? "Přidat další fotky"
                      : "Klikněte pro přidání fotek"}
                </span>
              </button>
              <p className="text-xs text-muted-foreground">
                Nepovinné — AI bude fotky vidět při analýze a výsledky budou přesnější.
                JPG, PNG nebo WebP · až {IMAGE_LIMITS.maxFiles} fotek · velké fotky zmenšíme automaticky.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || compressing} className="flex-1">
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
