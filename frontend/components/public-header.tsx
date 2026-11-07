"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Hlavička veřejných stránek. Jazyk = URL (/en), přepínač tedy navíguje mezi
 *  českou a anglickou adresou (ne klientský přepínač) — kvůli SEO a sdílení. */
export function PublicHeader() {
  const t = useT();
  // Přihlášený uživatel nesmí na veřejných stránkách vidět jen „Přihlásit" —
  // vypadá to jako odhlášení. Token se tu nemaže (veřejné stránky nic ověřeného
  // nevolají), jen hlavička to musí dát najevo → odkaz zpět do aplikace.
  const { user } = useAuth();
  const pathname = usePathname() || "/";
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const csPath = isEn ? pathname.replace(/^\/en/, "") || "/" : pathname;
  const enPath = csPath === "/" ? "/en" : `/en${csPath}`;
  const p = (path: string) => (isEn ? (path === "/" ? "/en" : `/en${path}`) : path);

  const linkStyle = { color: "oklch(0.52 0.04 50)" };
  const activeLang = { background: "oklch(0.78 0.11 196 / 0.22)", color: "oklch(0.32 0.08 200)" };

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
        <Link href={p("/")} className="flex items-center gap-2">
          <span className="text-xl">✦</span>
          <span className="font-heading text-lg font-medium tracking-wide" style={{ color: "oklch(0.22 0.04 48)" }}>
            handmade.net
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={p("/vyrobci")} className="text-sm hover:opacity-70 transition-opacity" style={linkStyle}>
            {t("mk.nav")}
          </Link>
          <Link href={p("/blog")} className="text-sm hover:opacity-70 transition-opacity" style={linkStyle}>
            {t("blog.nav")}
          </Link>
          {/* Jazyk = navigace mezi CS a EN URL */}
          <div className="flex items-center text-xs rounded-full border overflow-hidden" style={{ borderColor: "oklch(0.85 0.02 72)" }}>
            <Link href={csPath} className="px-2 py-1 transition-colors" style={!isEn ? activeLang : linkStyle} aria-current={!isEn ? "page" : undefined}>
              CS
            </Link>
            <Link href={enPath} className="px-2 py-1 transition-colors" style={isEn ? activeLang : linkStyle} aria-current={isEn ? "page" : undefined}>
              EN
            </Link>
          </div>
          {user ? (
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {t("nav.toApp")}
            </Link>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {t("auth.login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
