"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, MakerProfile } from "@/lib/api";
import { compressImage, ImageUploadError } from "@/lib/image-upload";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
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
  const t = useT();
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
      const compressed = await compressImage(file);
      const updated = await api.makers.uploadProfileImage(compressed);
      setProfile(updated);
      toast.success(t("profile.avatarUpdated"));
    } catch (err: unknown) {
      if (err instanceof ImageUploadError) toast.error(err.fullMessage);
      else toast.error(err instanceof Error ? err.message : t("err.uploadFailed"));
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
      toast.error(err instanceof Error ? err.message : t("pe.portalError"));
      setPortalLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName.trim()) { toast.error(t("pe.brandRequired")); return; }
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
      toast.success(t("pe.profileSaved"));
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("err.saveFailed"));
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
          {t("pe.backToProfile")}
        </Link>
        <h1 className="font-heading text-4xl font-light mt-3 heading-accent">
          {isNew ? t("pe.createTitle") : t("pe.editTitle")}
        </h1>
      </div>

      {/* Účet */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">{t("pe.accountCard")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                {profile?.profileImageUrl && (
                  <AvatarImage src={profile.profileImageUrl} alt={t("nav.profile")} />
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
                title={isNew ? t("pe.saveFirst") : t("pe.changePhotoShort")}
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
                {t("profile.plan")}{" "}
                <span className="font-medium" style={{ color: "oklch(0.40 0.10 196)" }}>
                  {PLAN_LABELS[user?.plan || "free"]}
                </span>
                {" · "}
                {limit === 99999 ? t("pe.unlimited") : `${limit} ${t("pe.perMonth")}`}
              </p>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs text-muted-foreground hover:underline mt-0.5 cursor-pointer"
                >
                  {uploadingAvatar ? t("prod.uploading") : t("pe.changePhoto")}
                </button>
              )}
              {isNew && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pe.addPhotoAfter")}
                </p>
              )}
            </div>
          </div>
          {user?.plan !== "free" && (
            <div className="pt-1">
              <Button size="sm" variant="ghost" onClick={handlePortal} disabled={portalLoading} className="text-xs">
                {portalLoading ? t("pe.opening") : t("pe.managePlan")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulář */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">{t("pe.studioCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="brand">{t("pe.brandLabel")}</Label>
              <Input
                id="brand"
                placeholder={t("pe.brandPlaceholder")}
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">{t("pe.bioLabel")}</Label>
              <Textarea
                id="bio"
                placeholder={t("pe.bioPlaceholder")}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video">{t("pe.videoLabel")}</Label>
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
                {saving ? t("new.submitting") : isNew ? t("pe.createTitle") : t("pe.save")}
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
