/**
 * Všechna čísla navádění na jednom místě (dle skillu navadeni). Ladění prahů =
 * jedna změna tady, ne hledání po projektu. Logika patří do automat.ts.
 */
export const PRAVIDLA = {
  /** První vteřiny po příchodu — nenapovídá se NIKDY (ať se člověk rozkouká). */
  prichodMs: 3000,
  /** Ticho po aktivitě, po kterém usoudíme „hledá a nenachází". */
  tichoMs: 9000,
  /** Jak dlouho je nápověda vidět, než sama zhasne. */
  napovedaMs: 5500,
  /** Klid mezi dvěma nápovědami. */
  klidMs: 25000,
  /** Nejvýš tolik nápověd za návštěvu. Čtvrtá už je otravování. */
  maxZaNavstevu: 3,
} as const;

export type Pravidla = typeof PRAVIDLA;
