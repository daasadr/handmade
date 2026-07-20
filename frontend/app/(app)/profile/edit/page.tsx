"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, MakerProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PLAN_LABELS: Record<string, string> = { free: "Free", mini: "Mini", midi: "Midi", max: "Max" };
const PLAN_LIMITS: Record<string, number> = { free: 5, mini: 30, midi: 150, max: 99999 };

export default function ProfileEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<MakerProfile | null>(null);
  const [form, setForm] = useState({ brandName: "", bio: "", videoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.makers.getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ brandName: p.brandName, bio: p.bio || "", videoUrl: p.videoUrl || "" });
      })
      .catch(() => setIsNew(true))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await api.makers.uploadProfileImage(file);
      setProfile(updated);
      toast.success("Fotka profilu aktualizována!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Nahrávání selhalo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Chyba při otevírání portálu");
      setPortalLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName.trim()) { toast.error("Název značky je povinný"); return; }
    setSaving(true);
    try {
      const data = {
        brandName: form.brandName,
        bio: form.bio || undefined,
        videoUrl: form.videoUrl || undefined,
      };
      const p = isNew
        ? await api.makers.createProfile(data)
        : await api.makers.updateProfile(data);
      setProfile(p);
      setIsNew(false);
      toast.success("Profil uložen!");
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Uložení selhalo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  const limit = PLAN_LIMITS[user?.plan || "free"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
          ← Zpět na profil
        </Link>
        <h1 className="font-heading text-4xl font-light mt-3 heading-accent">
          {isNew ? "Vytvořte profil" : "Upravit profil"}
        </h1>
      </div>

      {/* Účet */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">Účet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                {profile?.profileImageUrl && (
                  <AvatarImage src={profile.profileImageUrl} alt="Profilová fotka" />
                )}
                <AvatarFallback
                  className="text-xl font-medium"
                  style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.35 0.04 50)" }}
                >
                  {user?.email?.[0]?.toUpperCase() ?? "M"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar || isNew}
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                style={{ background: "oklch(0.22 0.04 48 / 0.6)" }}
                title={isNew ? "Nejdřív uložte profil" : "Změnit fotku"}
              >
                <span className="text-white text-xs">{uploadingAvatar ? "…" : "✎"}</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Tarif{" "}
                <span className="font-medium" style={{ color: "oklch(0.40 0.10 196)" }}>
                  {PLAN_LABELS[user?.plan || "free"]}
                </span>
                {" · "}
                {limit === 99999 ? "Neomezené" : `${limit} optimalizací/měsíc`}
              </p>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs text-muted-foreground hover:underline mt-0.5 cursor-pointer"
                >
                  {uploadingAvatar ? "Nahrávám…" : "Změnit fotku profilu"}
                </button>
              )}
              {isNew && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fotku lze přidat po vytvoření profilu
                </p>
              )}
            </div>
          </div>
          {user?.plan !== "free" && (
            <div className="pt-1">
              <Button size="sm" variant="ghost" onClick={handlePortal} disabled={portalLoading} className="text-xs">
                {portalLoading ? "Otevírám…" : "Spravovat předplatné"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulář */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">Studio profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Název značky / studia *</Label>
              <Input
                id="brand"
                placeholder="např. Keramické studio Marta"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">O vás / vašem studiu</Label>
              <Textarea
                id="bio"
                placeholder="Krátce o sobě, co vyrábíte, vaše inspirace..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video">Video URL (YouTube / Vimeo)</Label>
              <Input
                id="video"
                placeholder="https://youtube.com/watch?v=... nebo youtu.be/..."
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Vložte odkaz na video o vašem studiu — zobrazí se jako přehrávač na profilu
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? "Ukládám…" : isNew ? "Vytvořit profil" : "Uložit změny"}
              </Button>
              {!isNew && (
                <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }))}>
                  Zrušit
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
