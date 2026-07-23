"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api, Product, AiOptimization } from "@/lib/api";
import { prepareImages, formatBytes } from "@/lib/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const CATEGORIES = [
  "Šperky", "Oblečení & Doplňky", "Domov & Zahrada", "Hračky & Hry",
  "Umění & Sběratelství", "Svíčky & Vonné produkty", "Papírnictví",
  "Keramika & Hrnčířství", "Textil & Tkaní", "Dřevěné výrobky", "Jiné",
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState<"etsy" | "amazon">("etsy");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState<string | null>(null);
  const [latestOpt, setLatestOpt] = useState<AiOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ titleOriginal: "", descriptionOriginal: "", priceOriginal: "", category: "" });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      setLatestOpt(result);
      setProduct((p) => p ? { ...p, status: "analyzed" } : p);
      toast.success("AI analýza dokončena!");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analýza selhala");
    } finally {
      setAnalyzing(false);
    }
  };

  const BG_PRESETS: { label: string; color: string | undefined; display: string; pattern?: boolean }[] = [
    { label: "Průhledné", color: undefined, display: "transparent", pattern: true },
    { label: "Bílé", color: "ffffff", display: "#ffffff" },
    { label: "Slonová kost", color: "f5f0e8", display: "#f5f0e8" },
    { label: "Světle šedé", color: "e8e4df", display: "#e8e4df" },
  ];

  const handleRemoveBg = async (imageId: string, bgColor?: string) => {
    setRemovingBg(imageId);
    try {
      const updated = await api.products.removeBg(id, imageId, bgColor);
      setProduct(updated);
      toast.success("Pozadí odstraněno!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Odstranění pozadí selhalo");
    } finally {
      setRemovingBg(null);
    }
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const { files, errors, originalBytes, compressedBytes } = await prepareImages(selected);
      errors.forEach((msg) => toast.error(msg));

      if (!files.length) return;

      const updated = await api.products.uploadImages(id, files);
      setProduct(updated);

      const saved = originalBytes - compressedBytes;
      toast.success(
        `${files.length} ${files.length === 1 ? "fotka nahrána" : "fotky nahrány"}!` +
          (saved > 0 ? ` Zmenšeno o ${formatBytes(saved)}.` : ""),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Nahrání selhalo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const openEdit = () => {
    if (!product) return;
    setEditForm({
      titleOriginal: product.titleOriginal,
      descriptionOriginal: product.descriptionOriginal,
      priceOriginal: product.priceOriginal?.toString() ?? "",
      category: product.category ?? "",
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.products.update(id, {
        titleOriginal: editForm.titleOriginal,
        descriptionOriginal: editForm.descriptionOriginal,
        priceOriginal: editForm.priceOriginal ? parseFloat(editForm.priceOriginal) : undefined,
        category: editForm.category || undefined,
      });
      setProduct(updated);
      setEditMode(false);
      toast.success("Produkt byl uložen!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Uložení selhalo");
    } finally {
      setSaving(false);
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

  const images = product.images || [];

  // Lightbox overlay
  const Lightbox = lightboxUrl ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 cursor-zoom-out"
      onClick={() => setLightboxUrl(null)}
    >
      <img
        src={lightboxUrl}
        alt="Náhled"
        className="max-w-[92vw] max-h-[92vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-5 text-white text-3xl leading-none opacity-80 hover:opacity-100"
        onClick={() => setLightboxUrl(null)}
      >
        ×
      </button>
    </div>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {Lightbox}
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

      {/* Fotografie produktu */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg font-normal text-muted-foreground">
              Fotografie produktu
            </CardTitle>
            <div className="flex items-center gap-2">
              {images.length > 0 && (
                <span className="text-xs text-muted-foreground">{images.length} foto</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUploadImages}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs px-3 py-1 rounded-full font-medium transition-all disabled:opacity-50"
                style={{ background: "oklch(0.78 0.11 196 / 0.15)", color: "oklch(0.35 0.10 196)" }}
              >
                {uploading ? "Nahrávám…" : "+ Přidat fotky"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-all hover:border-current disabled:opacity-50"
              style={{ borderColor: "oklch(0.80 0.04 72)", color: "oklch(0.65 0.04 50)" }}
            >
              <span className="text-2xl">📷</span>
              <span className="text-sm">Klikněte pro nahrání fotek</span>
              <span className="text-xs opacity-70">
                AI bude fotky vidět při analýze — výsledky budou přesnější
              </span>
              <span className="text-xs opacity-50">
                JPG, PNG nebo WebP · až 10 fotek · velké fotky zmenšíme automaticky
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                    style={{ background: "oklch(0.88 0.02 72)" }}
                  >
                    <img
                      src={img.imageUrl}
                      alt="Produkt"
                      className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-200"
                      onClick={() => setLightboxUrl(img.imageUrl)}
                    />
                    {removingBg === img.id ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <span className="text-white text-xs animate-pulse">Odstraňuji…</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "oklch(0.15 0.02 50 / 0.75)", color: "white" }}>
                          ✂ Pozadí
                        </span>
                        <div className="flex gap-1">
                          {BG_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => handleRemoveBg(img.id, preset.color)}
                              title={preset.label}
                              className="w-5 h-5 rounded-full border-2 border-white/70 hover:border-white hover:scale-110 transition-all shadow-sm"
                              style={
                                preset.pattern
                                  ? { background: "conic-gradient(#ccc 90deg, white 90deg 180deg, #ccc 180deg 270deg, white 270deg)" }
                                  : { background: preset.display }
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-all hover:border-current disabled:opacity-50"
                style={{ borderColor: "oklch(0.80 0.04 72)", color: "oklch(0.65 0.04 50)" }}
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Původní text */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg font-normal text-muted-foreground">
              Původní listing
            </CardTitle>
            {!editMode ? (
              <button
                onClick={openEdit}
                className="text-xs px-3 py-1 rounded-full font-medium transition-all"
                style={{ background: "oklch(0.88 0.02 72)", color: "oklch(0.52 0.04 50)" }}
              >
                Upravit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: "oklch(0.88 0.02 72)", color: "oklch(0.52 0.04 50)" }}
                >
                  Zrušit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs px-3 py-1 rounded-full font-medium disabled:opacity-50"
                  style={{ background: "oklch(0.78 0.11 196)", color: "oklch(0.15 0.03 200)" }}
                >
                  {saving ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Název produktu</Label>
                <Input
                  id="edit-title"
                  value={editForm.titleOriginal}
                  onChange={(e) => setEditForm({ ...editForm, titleOriginal: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Popis produktu</Label>
                <Textarea
                  id="edit-desc"
                  value={editForm.descriptionOriginal}
                  onChange={(e) => setEditForm({ ...editForm, descriptionOriginal: e.target.value })}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-price">Cena (EUR)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.priceOriginal}
                    onChange={(e) => setEditForm({ ...editForm, priceOriginal: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cat">Kategorie</Label>
                  <select
                    id="edit-cat"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ background: "oklch(0.97 0.008 80)", borderColor: "oklch(0.85 0.02 72)" }}
                  >
                    <option value="">Vyberte kategorii</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Název</p>
                <p className="font-medium">{product.titleOriginal}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Popis</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.descriptionOriginal}</p>
              </div>
              {(product.priceOriginal || product.category) && (
                <>
                  <Separator />
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    {product.priceOriginal && <span>{product.priceOriginal} EUR</span>}
                    {product.category && <span>{product.category}</span>}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI analýza — spuštění */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal flex items-center gap-2">
            <span style={{ color: "oklch(0.78 0.11 196)" }}>✦</span> AI Optimalizace
            {images.length > 0 && (
              <span
                className="text-xs font-normal px-2 py-0.5 rounded-full ml-1"
                style={{ background: "oklch(0.65 0.15 155 / 0.12)", color: "oklch(0.45 0.12 155)" }}
              >
                vidí {images.length} {images.length === 1 ? "fotku" : "fotky"}
              </span>
            )}
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
        <Card ref={resultsRef} className="border-0 card-mystical overflow-hidden" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardHeader style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196 / 0.12), oklch(0.65 0.15 155 / 0.12))" }}>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg font-normal">
                Optimalizovaný listing
              </CardTitle>
              <div className="flex flex-col items-end">
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
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full mt-0.5"
                  style={
                    latestOpt.scoreSource === "market"
                      ? { background: "oklch(0.65 0.15 155 / 0.18)", color: "oklch(0.38 0.12 155)" }
                      : { background: "oklch(0.85 0.02 72)", color: "oklch(0.45 0.04 50)" }
                  }
                  title={
                    latestOpt.scoreSource === "market"
                      ? "Spočítáno z reálné konkurence na Etsy"
                      : "Odhad AI — bez reálných dat konkurence"
                  }
                >
                  {latestOpt.scoreSource === "market" ? "★ z reálného trhu" : "odhad AI"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {latestOpt.platform === "etsy" ? "Etsy" : "Amazon Handmade"} · Claude AI
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {/* Přehled konkurence — jen když máme reálná data z Etsy */}
            {latestOpt.scoreSource === "market" && (
              <div
                className="rounded-xl p-4"
                style={{ background: "oklch(0.65 0.15 155 / 0.08)", border: "1px solid oklch(0.65 0.15 155 / 0.25)" }}
              >
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "oklch(0.40 0.12 155)" }}>
                  Přehled konkurence na Etsy
                </p>

                {(latestOpt.competitorCount ?? 0) > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Konkurenčních nabídek</p>
                        <p className="font-heading text-2xl font-light">
                          {latestOpt.competitorCount?.toLocaleString("cs-CZ")}
                        </p>
                      </div>
                      {latestOpt.priceMedian ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Cena konkurence (medián)</p>
                          <p className="font-heading text-2xl font-light">
                            {Math.round(latestOpt.priceMedian)} {latestOpt.priceCurrency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            rozpětí {Math.round(latestOpt.priceMin ?? 0)}–{Math.round(latestOpt.priceMax ?? 0)} {latestOpt.priceCurrency}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {latestOpt.priceMedian && product.priceOriginal ? (
                      <p className="text-sm mt-3" style={{ color: "oklch(0.40 0.04 50)" }}>
                        Vaše cena <strong>{product.priceOriginal} EUR</strong>{" "}
                        {product.priceOriginal <= latestOpt.priceMedian
                          ? "je pod mediánem trhu — cenově konkurenceschopná."
                          : (product.priceOriginal <= (latestOpt.priceMax ?? Infinity)
                              ? "je nad mediánem, ale stále v rozpětí trhu."
                              : "je nad celým rozpětím konkurence — zvažte, zda ji obhájí kvalita a příběh.")}
                      </p>
                    ) : null}

                    {(latestOpt.competitorTags?.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1.5">Nejčastější tagy konkurence:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestOpt.competitorTags!.slice(0, 12).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "oklch(0.94 0.012 75)", color: "oklch(0.40 0.04 50)" }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "oklch(0.40 0.04 50)" }}>
                    Na tato klíčová slova jsme na Etsy nenašli téměř žádnou konkurenci — může to být
                    nevyužitá nika, nebo termín, který zákazníci nehledají. Zvažte i obecnější klíčová slova.
                  </p>
                )}
              </div>
            )}

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
              {latestOpt.titleCzech && (
                <div className="mt-2 pl-3 border-l-2" style={{ borderColor: "oklch(0.78 0.11 196 / 0.35)" }}>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded mr-2" style={{ background: "oklch(0.78 0.11 196 / 0.12)", color: "oklch(0.35 0.10 196)" }}>CZ</span>
                  <span className="text-sm text-muted-foreground">{latestOpt.titleCzech}</span>
                </div>
              )}
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
              {latestOpt.descriptionCzech && (
                <div className="mt-3 pl-3 border-l-2" style={{ borderColor: "oklch(0.78 0.11 196 / 0.35)" }}>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded mr-2" style={{ background: "oklch(0.78 0.11 196 / 0.12)", color: "oklch(0.35 0.10 196)" }}>CZ</span>
                  <span className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{latestOpt.descriptionCzech}</span>
                </div>
              )}
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
              {latestOpt.pricingRecommendationCzech && (
                <div className="mt-2 pl-3 border-l-2" style={{ borderColor: "oklch(0.78 0.11 196 / 0.35)" }}>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded mr-2" style={{ background: "oklch(0.78 0.11 196 / 0.12)", color: "oklch(0.35 0.10 196)" }}>CZ</span>
                  <span className="text-sm text-muted-foreground">{latestOpt.pricingRecommendationCzech}</span>
                </div>
              )}
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
