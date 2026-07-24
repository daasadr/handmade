"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, MakerProfile, isVipActive } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const PLAN_LABELS: Record<string, string> = { free: "Free", mini: "Mini", midi: "Midi", max: "Max" };
const PLAN_LIMITS: Record<string, number> = { free: 5, mini: 30, midi: 150, max: 99999 };

function getYouTubeEmbedUrl(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&\s]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const long = url.match(/[?&]v=([^&\s]+)/);
  if (long) return `https://www.youtube.com/embed/${long[1]}`;
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const t = useT();
  const [profile, setProfile] = useState<MakerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    api.makers.getProfile()
      .then(setProfile)
      .catch(() => setNoProfile(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-3xl animate-pulse">✦</span>
      </div>
    );
  }

  const vip = isVipActive(user);
  const limit = PLAN_LIMITS[user?.plan || "free"];
  const embedUrl = profile?.videoUrl ? getYouTubeEmbedUrl(profile.videoUrl) : null;

  if (noProfile || !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-heading text-4xl font-light heading-accent">Profil</h1>
        <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-3xl">✦</p>
            <p className="font-heading text-xl font-light">{t("profile.notCreated")}</p>
            <p className="text-muted-foreground text-sm">{t("profile.notCreatedText")}</p>
            <Link href="/profile/edit" className={cn(buttonVariants(), "mt-2")}>
              {t("profile.create")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-4xl font-light heading-accent">Profil</h1>
        <Link
          href="/profile/edit"
          className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
        >
          {t("profile.edit")}
        </Link>
      </div>

      {/* Veřejná karta profilu */}
      <Card className="border-0 card-mystical overflow-hidden" style={{ background: "oklch(0.94 0.012 75)" }}>
        {/* Hero */}
        <div
          className="h-24 w-full"
          style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196 / 0.25), oklch(0.65 0.15 155 / 0.20))" }}
        />
        <CardContent className="pt-0 pb-6">
          {/* Avatar + jméno */}
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <Avatar className="h-16 w-16 ring-4" style={{ "--tw-ring-color": "oklch(0.94 0.012 75)" } as React.CSSProperties}>
              {profile.profileImageUrl && <AvatarImage src={profile.profileImageUrl} alt={profile.brandName} />}
              <AvatarFallback
                className="text-xl font-medium"
                style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.35 0.04 50)" }}
              >
                {profile.brandName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="font-heading text-2xl font-medium">{profile.brandName}</h2>
              {user?.isFoundingMember && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: "oklch(0.88 0.10 85 / 0.25)",
                    color: "oklch(0.50 0.14 75)",
                    border: "1px solid oklch(0.75 0.12 80 / 0.4)",
                  }}
                >
                  ✦ Founding Member
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm leading-relaxed text-foreground/80 mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Video embed */}
          {embedUrl && (
            <div className="rounded-xl overflow-hidden aspect-video bg-black/10 mb-4">
              <iframe
                src={embedUrl}
                title="Studio video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {profile.videoUrl && !embedUrl && (
            <a
              href={profile.videoUrl.startsWith("http") ? profile.videoUrl : `https://${profile.videoUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: "oklch(0.40 0.10 196)" }}
            >
              {t("profile.studioVideo")}
            </a>
          )}
        </CardContent>
      </Card>

      {/* Účet a tarif — vidí jen vlastník */}
      <Card className="border-0 card-mystical" style={{ background: "oklch(0.94 0.012 75)" }}>
        <CardContent className="py-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("profile.account")}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                {t("profile.plan")}{" "}
                <span className="font-medium" style={{ color: "oklch(0.40 0.10 196)" }}>
                  {PLAN_LABELS[user?.plan || "free"]}
                </span>
                {" · "}
                {user?.aiUsageThisMonth || 0} / {vip || limit === 99999 ? "∞" : limit} {t("profile.thisMonth")}
                {vip && (
                  <>
                    {" · "}
                    <span className="font-medium" style={{ color: "oklch(0.40 0.12 155)" }}>
                      VIP{user?.vipUntil ? ` ${t("profile.vipUntil")} ${new Date(user.vipUntil).toLocaleDateString()}` : ""}
                    </span>
                  </>
                )}
              </p>
            </div>
            {user?.plan === "free" && !vip && (
              <Link
                href="/tarify"
                className={cn(buttonVariants({ size: "sm" }))}
                style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }}
              >
                {t("profile.upgrade")}
              </Link>
            )}
          </div>
          <Separator />
          <Link
            href="/profile/edit"
            className="text-xs hover:underline"
            style={{ color: "oklch(0.52 0.04 50)" }}
          >
            Upravit profil →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
