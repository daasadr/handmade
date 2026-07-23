"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie_ack";

/**
 * Poctivá cookie lišta. Aplikace používá JEN technicky nezbytné místní úložiště
 * (přihlašovací token) — žádné sledovací ani analytické cookies. Proto to není
 * accept/reject souhlas se sledováním (není co odmítat), ale informace s
 * potvrzením „Rozumím". Potvrzení uložíme, aby se lišta neukazovala pořád.
 */
export function CookieConsent() {
  // Vykreslíme až po mountu — jinak by se na serveru a klientovi lišil obsah
  // (localStorage není na serveru) a došlo by k hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage nedostupný (privátní režim) — lištu prostě neukážeme.
    }
  }, []);

  if (!visible) return null;

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4"
      style={{ background: "oklch(0.22 0.04 48 / 0.97)", backdropFilter: "blur(6px)" }}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.92 0.01 80)" }}>
          Používáme jen <strong>technicky nezbytné</strong> místní úložiště, abyste zůstali
          přihlášeni. Žádné sledovací ani reklamní cookies.{" "}
          <Link href="/gdpr" className="underline hover:opacity-80" style={{ color: "oklch(0.82 0.09 196)" }}>
            Více v zásadách GDPR
          </Link>
          .
        </p>
        <button
          onClick={acknowledge}
          className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "oklch(0.78 0.11 196)", color: "oklch(0.15 0.03 200)" }}
        >
          Rozumím
        </button>
      </div>
    </div>
  );
}
