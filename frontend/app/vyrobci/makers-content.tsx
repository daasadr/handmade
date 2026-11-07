"use client";

import Link from "next/link";
import { PublicMakerCard } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { PublicHeader } from "@/components/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/** Vizuální část adresáře — data přicházejí ze server komponenty (SSR). */
export function MakersContent({ makers }: { makers: PublicMakerCard[] }) {
  const t = useT();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.973 0.008 80)" }}>
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <h1 className="font-heading text-4xl font-light heading-accent">{t("mk.title")}</h1>
        <p className="text-muted-foreground mt-3 mb-8">{t("mk.subtitle")}</p>

        {makers.length === 0 ? (
          <Card className="border-dashed border-2" style={{ borderColor: "oklch(0.85 0.02 72)", background: "transparent" }}>
            <CardContent className="py-16 text-center">
              <p className="text-3xl mb-3">✦</p>
              <p className="font-heading text-xl font-light text-muted-foreground">{t("mk.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {makers.map((m) => (
              <Link key={m.id} href={`/vyrobci/${m.id}`}>
                <Card className="border-0 card-mystical hover:shadow-md transition-shadow h-full" style={{ background: "oklch(0.94 0.012 75)" }}>
                  <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                    <Avatar className="h-20 w-20">
                      {m.profileImageUrl && <AvatarImage src={m.profileImageUrl} alt={m.brandName} />}
                      <AvatarFallback className="text-2xl font-medium" style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.35 0.04 50)" }}>
                        {m.brandName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-heading text-lg font-medium">{m.brandName}</p>
                      {m.motto && (
                        <p className="text-sm italic mt-1" style={{ color: "oklch(0.52 0.04 50)" }}>
                          „{m.motto}"
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
