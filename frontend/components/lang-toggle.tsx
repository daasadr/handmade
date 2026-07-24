"use client";

import { useLocale, type Locale } from "@/lib/i18n";

/** Přepínač jazyka CS | EN. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-full overflow-hidden text-xs font-medium ${className}`}
      style={{ border: "1px solid oklch(0.85 0.02 72)" }}
    >
      {(["cs", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className="px-2 py-0.5 transition-colors"
          style={{
            background: locale === l ? "oklch(0.78 0.11 196)" : "transparent",
            color: locale === l ? "oklch(0.15 0.03 200)" : "oklch(0.52 0.04 50)",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
