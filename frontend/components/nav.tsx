"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  mini: "Mini",
  midi: "Midi",
  max: "Max",
};

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Přehled" },
    { href: "/products", label: "Produkty" },
    { href: "/profile", label: "Profil" },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{ background: "oklch(0.94 0.012 75 / 0.95)", borderColor: "oklch(0.85 0.02 72)", backdropFilter: "blur(8px)" }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-xl group-hover:scale-110 transition-transform">✦</span>
          <span className="font-heading text-lg font-medium tracking-wide" style={{ color: "oklch(0.22 0.04 48)" }}>
            handmade.net
          </span>
        </Link>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: active ? "oklch(0.22 0.04 48)" : "oklch(0.52 0.04 50)",
                  background: active ? "oklch(0.88 0.02 72)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {user && (
            <span
              className="hidden sm:block text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.78 0.11 196 / 0.15)", color: "oklch(0.40 0.10 196)" }}
            >
              {PLAN_LABELS[user.plan] || user.plan}
            </span>
          )}
          <Avatar
            className="h-8 w-8 cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <AvatarFallback
              className="text-sm font-medium"
              style={{ background: "oklch(0.85 0.02 72)", color: "oklch(0.35 0.04 50)" }}
            >
              {user?.email?.[0]?.toUpperCase() ?? "M"}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Odhlásit
          </Button>
        </div>
      </div>
    </nav>
  );
}
