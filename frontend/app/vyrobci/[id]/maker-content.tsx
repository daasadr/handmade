"use client";

import Link from "next/link";
import { PublicMaker, PLATFORM_LABELS, Platform } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { PublicHeader } from "@/components/public-header";
import { MakerStory } from "@/components/maker-story";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function youTubeEmbed(url: string): string | null {
  const short = url.match(/youtu\.be\/([^?&\s]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const long = url.match(/[?&]v=([^&\s]+)/);
  if (long) return `https://www.youtube.com/embed/${long[1]}`;
  if (url.includes("youtube.com/embed/")) return url;
  return null;
}

function shopLabel(key: string): string {
  return PLATFORM_LABELS[key as Platform] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** Vizuální část veřejného profilu — data ze server komponenty (SSR). */
export function MakerContent({ maker }: { maker: PublicMaker }) {
  const t = useT();
  const shopLinks = Object.entries(maker.marketplaceLinks || {}).filter(([, url]) => !!url);
  const embed = maker.videoUrl ? youTubeEmbed(maker.videoUrl) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
      <PublicHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/vyrobci" className="text-sm text-muted-foreground hover:text-foreground">
          {t("mk.back")}
        </Link>

        <Card className="border-0 card-mystical overflow-hidden mt-4" style={{ background: "oklch(0.94 0.012 75)" }}>
          <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196 / 0.25), oklch(0.65 0.15 155 / 0.20))" }} />
          <CardContent className="pt-0 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <Avatar className="h-20 w-20 ring-4" style={{ "--tw-ring-color": "oklch(0.94 0.012 75)" } as React.CSSProperties}>
                {maker.profileImageUrl && <AvatarImage src={maker.profileImageUrl} alt={maker.brandName} />}
                <AvatarFallback className="text-2xl font-medium" style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.35 0.04 50)" }}>
                  {maker.brandName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="font-heading text-3xl font-medium">{maker.brandName}</h1>
                {maker.motto && (
                  <p className="text-sm italic mt-0.5" style={{ color: "oklch(0.45 0.06 50)" }}>
                    „{maker.motto}"
                  </p>
                )}
              </div>
            </div>

            {shopLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {shopLinks.map(([key, url]) => (
                  <a
                    key={key}
                    href={url.startsWith("http") ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: "sm" }))}
                    style={{ background: "linear-gradient(135deg, oklch(0.78 0.11 196), oklch(0.65 0.15 155))", color: "white", border: "none" }}
                  >
                    {t("mk.buyOn")} {shopLabel(key)}
                  </a>
                ))}
              </div>
            )}

            <MakerStory
              storyMode={maker.storyMode}
              storyHtml={maker.storyHtml}
              storyAnswers={maker.storyAnswers}
              storyImages={maker.storyImages}
              bio={maker.bio}
            />

            {embed && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black/10 mt-4">
                <iframe
                  src={embed}
                  title="Studio video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </CardContent>
        </Card>

        {maker.products.length > 0 && (
          <div className="mt-8">
            <h2 className="font-heading text-2xl font-light mb-4">{t("mk.products")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {maker.products.map((p) => (
                <Card key={p.id} className="border-0 card-mystical overflow-hidden" style={{ background: "oklch(0.94 0.012 75)" }}>
                  {p.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="w-full aspect-square object-cover" />
                  )}
                  <CardContent className="py-4">
                    <p className="font-medium leading-snug">{p.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {p.category || ""}
                      {p.price ? `${p.category ? " · " : ""}${p.price} EUR` : ""}
                    </p>
                    {p.etsyListingId && (
                      <a
                        href={`https://www.etsy.com/listing/${p.etsyListingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full justify-center")}
                      >
                        {t("mk.buyOn")} Etsy
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {shopLinks.some(([k]) => k === "etsy") && (
          <p className="text-[11px] leading-relaxed text-muted-foreground mt-6">
            The term „Etsy" is a trademark of Etsy, Inc. This application uses the Etsy API
            but is not endorsed or certified by Etsy, Inc.
          </p>
        )}
      </main>
    </div>
  );
}
