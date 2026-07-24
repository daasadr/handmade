"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dict, type Dict } from "./i18n-dict";

export type Locale = "cs" | "en";

const STORAGE_KEY = "locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: "cs", setLocale: () => {} });

/**
 * Jazyk aplikace (cs/en). Aby nedošlo k hydration mismatch, první render
 * (server i klient) je vždy `cs`; skutečný jazyk se dopočítá až po mountu
 * z localStorage, jinak z jazyka prohlížeče.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("cs");

  useEffect(() => {
    let resolved: Locale | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "cs" || saved === "en") resolved = saved;
    } catch {
      /* ignore */
    }
    if (!resolved) {
      // První návštěva → podle prohlížeče. Čeština jen pro cs*, jinak angličtina.
      const nav = typeof navigator !== "undefined" ? navigator.language : "";
      resolved = nav.toLowerCase().startsWith("cs") ? "cs" : "en";
    }
    if (resolved !== "cs") setLocaleState(resolved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
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
