"use client";

import { useEffect, useRef } from "react";
import {
  type AutomatStav,
  type Udalost,
  vychozi,
  prechod,
  maNapovedet,
  oznacNapoved,
} from "@/lib/navadeni/automat";
import { PRAVIDLA } from "@/lib/navadeni/pravidla";

/** Píše uživatel zrovna do pole? Pak nevyrušovat (dle skillu). */
function piseDoPole(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
}

/**
 * Behaviorální navádění: jediné místo, které ví o myši, dotyku, čase a
 * viditelnosti; rozhodování je v čistém automatu. Když automat usoudí „hledá a
 * nenachází", přidá na cílový prvek třídu `je-navedeno` (tichý prstenec v CSS,
 * `pointer-events:none`, sám zhasne). Komponenta sama nic nevykresluje.
 */
export function Navadeni({ selector, enabled = true }: { selector: string; enabled?: boolean }) {
  const stavRef = useRef<AutomatStav | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const now = () => Date.now();
    stavRef.current = vychozi(now());

    const zkusNapovedet = () => {
      const s = stavRef.current;
      if (!s || !maNapovedet(s, now())) return;
      if (piseDoPole()) return; // ne uprostřed psaní
      const cil = document.querySelector<HTMLElement>(selector);
      if (!cil) return;
      cil.classList.add("je-navedeno");
      window.setTimeout(() => cil.classList.remove("je-navedeno"), PRAVIDLA.napovedaMs);
      stavRef.current = oznacNapoved(s, now());
    };

    const uprav = (u: Udalost) => {
      if (!stavRef.current) return;
      stavRef.current = prechod(stavRef.current, u);
      zkusNapovedet();
    };

    let posledniPohyb = 0;
    const onMove = () => {
      const t = Date.now();
      if (t - posledniPohyb < 400) return; // throttle
      posledniPohyb = t;
      uprav({ typ: "pohyb", cas: t });
    };
    const onClick = () => uprav({ typ: "klik", cas: Date.now() });
    const onFocusIn = () => {
      if (piseDoPole()) uprav({ typ: "cteni", cas: Date.now() });
    };

    let tik: number | undefined;
    const spustTik = () => {
      if (!tik) tik = window.setInterval(() => uprav({ typ: "tik", cas: Date.now() }), 1500);
    };
    const zastavTik = () => {
      if (tik) {
        clearInterval(tik);
        tik = undefined;
      }
    };
    // Časovač nesmí běžet v zavřené kartě (jinak nápověda naskočí všechna najednou
    // při návratu). Po návratu obnovíme „poslední aktivitu", ať ticho počítá znovu.
    const onVisibility = () => {
      if (document.hidden) {
        zastavTik();
      } else {
        if (stavRef.current) stavRef.current.posledniAktivita = Date.now();
        spustTik();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("focusin", onFocusIn);
    document.addEventListener("visibilitychange", onVisibility);
    spustTik();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("visibilitychange", onVisibility);
      zastavTik();
      document.querySelector<HTMLElement>(selector)?.classList.remove("je-navedeno");
    };
  }, [selector, enabled]);

  return null;
}
