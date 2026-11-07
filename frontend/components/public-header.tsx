"use client";

import Link from "next/link";
import { LangToggle } from "@/components/lang-toggle";
import { useT } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Jednoduchá hlavička pro veřejné (nepřihlášené) stránky výlohy. */
export function PublicHeader() {
  const t = useT();
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "oklch(0.94 0.012 75 / 0.95)",
        borderColor: "oklch(0.85 0.02 72)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <span className="font-heading text-lg font-medium tracking-wide" style={{ color: "oklch(0.22 0.04 48)" }}>
            handmade.net
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/vyrobci" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "oklch(0.52 0.04 50)" }}>
            {t("mk.nav")}
          </Link>
          <Link href="/blog" className="text-sm hover:opacity-70 transition-opacity" style={{ color: "oklch(0.52 0.04 50)" }}>
            {t("blog.nav")}
          </Link>
          <LangToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {t("auth.login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
