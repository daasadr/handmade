import { PRAVIDLA, type Pravidla } from "./pravidla";

/**
 * Čistý stavový automat navádění: stav + událost → nový stav. ŽÁDNÝ DOM, čas ani
 * window — ty dodá volající (komponenta). Díky tomu je to deterministické a
 * testovatelné bez prohlížeče (dle skillu navadeni).
 *
 * PŘÍCHOD → ROZHLÍŽÍ SE → HLEDÁ → ČTE
 *  - PŘÍCHOD: první vteřiny, nenapovídá se nikdy.
 *  - ROZHLÍŽÍ SE: pohybuje se, nic neotevřel.
 *  - HLEDÁ: byla aktivita, pak ticho = hledá a nenachází → TADY se napovídá.
 *  - ČTE: něco otevřel/píše → nechat být.
 */
export type Stav = "PRICHOD" | "ROZHLIZI" | "HLEDA" | "CTE";

export interface AutomatStav {
  stav: Stav;
  zacatek: number; // kdy přišel
  posledniAktivita: number; // poslední pohyb/klik
  napovedBehem: number; // kolik už se napovědělo
  posledniNapoved: number; // kdy naposledy (0 = nikdy)
}

export type Udalost =
  | { typ: "pohyb"; cas: number }
  | { typ: "klik"; cas: number }
  | { typ: "cteni"; cas: number } // fokus v poli / otevřený obsah
  | { typ: "tik"; cas: number };

export function vychozi(cas: number): AutomatStav {
  return {
    stav: "PRICHOD",
    zacatek: cas,
    posledniAktivita: cas,
    napovedBehem: 0,
    posledniNapoved: 0,
  };
}

export function prechod(
  s: AutomatStav,
  u: Udalost,
  p: Pravidla = PRAVIDLA,
): AutomatStav {
  switch (u.typ) {
    case "cteni":
      // Něco otevřel nebo píše — nechat být.
      return { ...s, stav: "CTE", posledniAktivita: u.cas };

    case "klik":
      // Klik = akce; bereme to jako „je v tom" (do příště).
      return { ...s, stav: "CTE", posledniAktivita: u.cas };

    case "pohyb": {
      const poPrichodu = u.cas - s.zacatek >= p.prichodMs;
      // Z PŘÍCHODU ven až po úvodních vteřinách; ze ČTE zpět k rozhlížení.
      const stav: Stav = !poPrichodu ? "PRICHOD" : "ROZHLIZI";
      return { ...s, stav, posledniAktivita: u.cas };
    }

    case "tik": {
      // Ticho, kterému předcházela aktivita (ne hned po příchodu) → HLEDÁ.
      if (
        s.stav === "ROZHLIZI" &&
        u.cas - s.zacatek >= p.prichodMs &&
        u.cas - s.posledniAktivita >= p.tichoMs
      ) {
        return { ...s, stav: "HLEDA" };
      }
      return s;
    }
  }
}

/** Má se teď napovědět? Jen v HLEDÁ, s respektem k počtu a klidu mezi nápovědami. */
export function maNapovedet(
  s: AutomatStav,
  cas: number,
  p: Pravidla = PRAVIDLA,
): boolean {
  return (
    s.stav === "HLEDA" &&
    s.napovedBehem < p.maxZaNavstevu &&
    cas - s.posledniNapoved >= p.klidMs
  );
}

/** Zaznamená, že se právě napovědělo, a vrátí automat zpět k rozhlížení. */
export function oznacNapoved(s: AutomatStav, cas: number): AutomatStav {
  return {
    ...s,
    stav: "ROZHLIZI",
    napovedBehem: s.napovedBehem + 1,
    posledniNapoved: cas,
    posledniAktivita: cas,
  };
}
