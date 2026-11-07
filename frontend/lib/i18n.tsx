"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { dict, type Dict } from "./i18n-dict";
import { getStored, setStored } from "./safe-storage";

export type Locale = "cs" | "en";

const STORAGE_KEY = "locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: "cs", setLocale: () => {} });

/**
 * Veřejné lokalizované stránky (mají `/` i `/en` variantu renderovanou serverem).
 * Na nich MUSÍ o jazyku rozhodovat URL, ne uložená volba — jinak přihlášený
 * uživatel s uloženým "en" uvidí anglicky i českou URL (/blog) a přepínač
 * „vypadá, že nefunguje". Appka (dashboard, profil…) /en prefix nemá a řídí se
 * uloženou volbou přes vlastní přepínač.
 */
function isLocalizedPublicPath(pathname: string | null): boolean {
  const p = (pathname ?? "/").replace(/^\/en/, "") || "/";
  return (
    p === "/" ||
    p === "/blog" ||
    p.startsWith("/blog/") ||
    p === "/vyrobci" ||
    p.startsWith("/vyrobci/")
  );
}

/**
 * Jazyk aplikace (cs/en). `initialLocale` dodá server podle URL (/en = en),
 * aby se stránka vykreslila ve správném jazyce UŽ na serveru (SEO) a sedělo to
 * s prvním klientským renderem (bez hydration mismatch).
 *
 * Po mountu a při každé změně cesty: URL rozhoduje — `/en/*` = anglicky; jinak
 * uložená volba / jazyk prohlížeče. Díky napojení na `usePathname` se jazyk mění
 * i při klientské navigaci mezi /blog a /en/blog.
 */
export function LocaleProvider({
  children,
  initialLocale = "cs",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (pathname === "/en" || pathname?.startsWith("/en/")) {
      setLocaleState("en");
      setStored(STORAGE_KEY, "en");
      return;
    }
    // Veřejná lokalizovaná stránka bez /en = čeština podle URL. URL VYHRÁVÁ nad
    // uloženou volbou — jinak by uložené "en" (z dřívějška) zobrazilo /blog
    // anglicky a přepínač „nefungoval". localStorage zde nepřepisujeme, ať to
    // nerozbije jazyk appky (ta má /en prefix a řídí se vlastním přepínačem).
    if (isLocalizedPublicPath(pathname)) {
      setLocaleState("cs");
      return;
    }
    const saved = getStored(STORAGE_KEY);
    if (saved === "cs" || saved === "en") {
      setLocaleState(saved);
      return;
    }
    const nav = typeof navigator !== "undefined" ? navigator.language : "";
    setLocaleState(nav.toLowerCase().startsWith("cs") ? "cs" : "en");
  }, [pathname]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setStored(STORAGE_KEY, l);
  }, []);

  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx);
}

/** Vrací překladovou funkci `t(key)` pro aktuální jazyk (fallback na češtinu, pak klíč). */
export function useT() {
  const { locale } = useContext(Ctx);
  return useCallback(
    (key: keyof Dict) => dict[locale][key] ?? dict.cs[key] ?? (key as string),
    [locale],
  );
}
