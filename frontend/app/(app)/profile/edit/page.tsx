"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, MakerProfile } from "@/lib/api";
import { compressImage, ImageUploadError } from "@/lib/image-upload";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { STORY_QUESTION_KEYS, CURATED_QUOTES } from "@/lib/story-template";
import { getStored, setStored, removeStored } from "@/lib/safe-storage";
import dynamic from "next/dynamic";

// TipTap jen na klientovi — ssr:false brání hydration mismatchi a nenačítá
// těžkou knihovnu na server. `loading` ukáže indikátor, než se chunk stáhne
// (knihovna je velká, chvíli to trvá).
function EditorLoadingFallback() {
  const t = useT();
  return (
    <div
      className="rounded-lg border flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
      style={{ borderColor: "oklch(0.85 0.02 72)" }}
    >
      <span className="text-xl animate-pulse">✦</span> {t("pe.editorLoading")}
    </div>
  );
}
const StoryEditor = dynamic(() => import("@/components/story-editor"), {
  ssr: false,
  loading: () => <EditorLoadingFallback />,
});
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
  const [form, setForm] = useState({
    brandName: "",
    bio: "",
    videoUrl: "",
    motto: "",
    story: {} as Record<string, string>,
    storyImages: {} as Record<string, string>,
    storyMode: "template" as "template" | "custom",
    storyHtml: "",
    isPublic: false,
  });
  const [showQuotes, setShowQuotes] = useState(false);
  const [uploadingStoryKey, setUploadingStoryKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Rozpracovaný koncept ukládáme do prohlížeče, ať se text neztratí. Klíč per
  // uživatel, aby se na sdíleném prohlížeči nemíchaly koncepty dvou lidí.
  const draftKey = `profile-draft-${user?.id ?? "anon"}`;
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isNew, setIsNew] = useState(false);
  // U nového profilu ještě neexistuje záznam, ke kterému by se fotka připnula
  // (upload volá getProfile). Vybranou fotku proto podržíme a nahrajeme hned po
  // vytvoření profilu — ať ji uživatel přidá rovnou při zakládání.
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.makers.getProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          brandName: p.brandName,
          bio: p.bio || "",
          videoUrl: p.videoUrl || "",
          motto: p.motto || "",
          story: p.storyAnswers || {},
          storyImages: p.storyImages || {},
          storyMode: p.storyMode === "custom" ? "custom" : "template",
          storyHtml: p.storyHtml || "",
          isPublic: p.isPublic ?? false,
        });
      })
      .catch(() => setIsNew(true))
      .finally(() => {
        // Obnov rozpracovaný koncept (má přednost před serverem — neztratit rozepsané).
        const draft = getStored(draftKey);
        if (draft) {
          try {
            setForm((f) => ({ ...f, ...JSON.parse(draft) }));
          } catch {
            /* poškozený koncept ignorujeme */
          }
        }
        setHydrated(true);
        setLoading(false);
      });
    // Běží jednou při načtení; draftKey je stabilní po přihlášení.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Průběžné ukládání konceptu (debounce) do prohlížeče — přežije reload, pád
  // i omylem zavřenou záložku. Po úspěšném uložení profilu se koncept smaže.
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => setStored(draftKey, JSON.stringify(form)), 500);
    return () => clearTimeout(id);
  }, [form, hydrated, draftKey]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      if (isNew) {
        // Profil ještě není uložený → fotku jen podržíme a ukážeme náhled.
        // Nahraje se v handleSave hned po createProfile.
        if (pendingAvatarPreview) URL.revokeObjectURL(pendingAvatarPreview);
        setPendingAvatar(compressed);
        setPendingAvatarPreview(URL.createObjectURL(compressed));
        return;
      }
      setUploadingAvatar(true);
      const updated = await api.makers.uploadProfileImage(compressed);
      setProfile(updated);
      toast.success(t("profile.avatarUpdated"));
    } catch (err: unknown) {
      if (err instanceof ImageUploadError) toast.error(err.fullMessage);
      else toast.error(err instanceof Error ? err.message : t("err.uploadFailed"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleStoryImage = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingStoryKey(key);
    try {
      const compressed = await compressImage(file);
      const { url } = await api.makers.uploadStoryImage(compressed);
      setForm((f) => ({ ...f, storyImages: { ...f.storyImages, [key]: url } }));
    } catch (err: unknown) {
      if (err instanceof ImageUploadError) toast.error(err.fullMessage);
      else toast.error(err instanceof Error ? err.message : t("err.uploadFailed"));
    } finally {
      setUploadingStoryKey(null);
    }
  };

  const removeStoryImage = (key: string) => {
    setForm((f) => {
      const next = { ...f.storyImages };
      delete next[key];
      return { ...f, storyImages: next };
    });
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
    if (!form.brandName.trim()) {
      toast.error(t("pe.brandRequired"));
      // Pole názvu bývá odscrollované nahoře — doscrollujeme k němu a zaostříme,
      // ať je jasné, kam hláška míří (dřív na to ukazovala nativní bublina u lišty).
      const el = document.getElementById("brand") as HTMLInputElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }
    setSaving(true);
    try {
      const data = {
        brandName: form.brandName,
        bio: form.bio || undefined,
        videoUrl: form.videoUrl || undefined,
        motto: form.motto || undefined,
        storyAnswers: form.story,
        storyImages: form.storyImages,
        storyMode: form.storyMode,
        storyHtml: form.storyMode === "custom" ? form.storyHtml : undefined,
        isPublic: form.isPublic,
      };
      let p = isNew
        ? await api.makers.createProfile(data)
        : await api.makers.updateProfile(data);
      // Fotka vybraná při zakládání: teď už profil existuje, tak ji nahrajeme.
      if (isNew && pendingAvatar) {
        try {
          p = await api.makers.uploadProfileImage(pendingAvatar);
        } catch {
          toast.error(t("pe.photoAfterSaveFailed"));
        }
        setPendingAvatar(null);
        if (pendingAvatarPreview) {
          URL.revokeObjectURL(pendingAvatarPreview);
          setPendingAvatarPreview(null);
        }
      }
      setProfile(p);
      setIsNew(false);
      removeStored(draftKey); // uloženo na server → koncept už netřeba
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
                {(pendingAvatarPreview || profile?.profileImageUrl) && (
                  <AvatarImage src={pendingAvatarPreview ?? profile?.profileImageUrl} alt={t("nav.profile")} />
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
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                style={{ background: "oklch(0.22 0.04 48 / 0.6)" }}
                title={t("pe.changePhotoShort")}
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
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs text-muted-foreground hover:underline mt-0.5 cursor-pointer"
              >
                {uploadingAvatar ? t("prod.uploading") : t("pe.changePhoto")}
              </button>
              {isNew && pendingAvatar && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pe.photoWithProfile")}
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
          {/* noValidate: nativní validaci řešíme sami (toast + doscrollování),
              ať nevyskakuje bublina mířící do horní lišty. */}
          <form onSubmit={handleSave} noValidate className="space-y-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>✦</span> {t("pe.autosaveNote")}
            </p>
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

            {/* Veřejná výloha — opt-in */}
            <div className="pt-3 border-t" style={{ borderColor: "oklch(0.85 0.02 72)" }}>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-sm font-medium">{t("pe.makePublic")}</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">{t("pe.makePublicHint")}</p>
            </div>

            {/* Příběh tvůrce */}
            <div className="pt-3 border-t" style={{ borderColor: "oklch(0.85 0.02 72)" }}>
              <h3 className="font-heading text-lg font-normal mt-2">{t("pe.storyCard")}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{t("pe.storyIntro")}</p>

              {/* Motto + nabídka citátů */}
              <div className="space-y-1.5">
                <Label htmlFor="motto">{t("pe.mottoLabel")}</Label>
                <Input
                  id="motto"
                  placeholder={t("pe.mottoPlaceholder")}
                  value={form.motto}
                  maxLength={200}
                  onChange={(e) => setForm({ ...form, motto: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowQuotes((v) => !v)}
                  className="text-xs hover:underline"
                  style={{ color: "oklch(0.40 0.10 196)" }}
                >
                  {showQuotes ? t("pe.hideQuotes") : t("pe.pickQuote")}
                </button>
                {showQuotes && (
                  <div
                    className="flex flex-col gap-0.5 mt-1 max-h-52 overflow-y-auto rounded-lg p-2"
                    style={{ background: "oklch(0.97 0.008 80)" }}
                  >
                    {CURATED_QUOTES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => { setForm({ ...form, motto: q }); setShowQuotes(false); }}
                        className="text-left text-xs px-2 py-1.5 rounded hover:bg-black/5 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Přepínač režimu: šablona vs volný editor */}
              <div className="flex gap-2 mt-5 mb-1">
                {(["template", "custom"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, storyMode: m })}
                    className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                    style={
                      form.storyMode === m
                        ? { background: "oklch(0.78 0.11 196 / 0.2)", borderColor: "oklch(0.78 0.11 196)", color: "oklch(0.35 0.08 200)" }
                        : { borderColor: "oklch(0.85 0.02 72)", color: "oklch(0.52 0.04 50)" }
                    }
                  >
                    {m === "template" ? t("pe.modeTemplate") : t("pe.modeCustom")}
                  </button>
                ))}
              </div>

              {form.storyMode === "custom" ? (
                <div className="mt-3">
                  <StoryEditor
                    value={form.storyHtml}
                    onChange={(html) => setForm((f) => ({ ...f, storyHtml: html }))}
                  />
                </div>
              ) : (
              <div className="space-y-4 mt-4">
                <p
                  className="text-xs rounded-lg px-3 py-2"
                  style={{ background: "oklch(0.78 0.11 196 / 0.10)", color: "oklch(0.40 0.06 50)" }}
                >
                  {t("pe.storyTemplateHint")}
                </p>
                {STORY_QUESTION_KEYS.map((k) => (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={`story-${k}`}>
                      {t(`story.q.${k}` as Parameters<typeof t>[0])}
                    </Label>
                    <Textarea
                      id={`story-${k}`}
                      rows={3}
                      className="resize-none"
                      placeholder={t(`story.q.${k}.ph` as Parameters<typeof t>[0])}
                      value={form.story[k] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, story: { ...form.story, [k]: e.target.value } })
                      }
                    />
                    {form.storyImages[k] ? (
                      <div className="relative inline-block mt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.storyImages[k]}
                          alt=""
                          className="h-24 rounded-lg object-cover border"
                          style={{ borderColor: "oklch(0.85 0.02 72)" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeStoryImage(k)}
                          aria-label={t("pe.removeImage")}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full text-white text-sm flex items-center justify-center transition-opacity hover:opacity-90"
                          style={{ background: "oklch(0.22 0.04 48 / 0.85)" }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label
                        className="inline-flex items-center gap-1 text-xs cursor-pointer hover:underline mt-1"
                        style={{ color: "oklch(0.40 0.10 196)" }}
                      >
                        {uploadingStoryKey === k ? t("prod.uploading") : t("pe.addStoryImage")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingStoryKey === k}
                          onChange={(e) => handleStoryImage(k, e)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              )}
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
