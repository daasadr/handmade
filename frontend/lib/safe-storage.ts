/**
 * Jediné povolené místo, kudy se sahá na localStorage.
 *
 * Firefox v přísném režimu ochrany proti sledování hodí výjimku i při ČTENÍ
 * z úložiště — ne až při zápisu. Když neošetřené čtení spadne v api.ts nebo
 * v AuthProvideru, padne to dřív, než se stránka vůbec vykreslí, a uživateli
 * „nefungují tlačítka". Proto všechny přístupy vedou přes tenhle soubor a jsou
 * v try/catch; při nedostupném úložišti se aplikace chová, jako by bylo prázdné.
 *
 * (Chyba převzatá z projektu AlmostThere — stála den hledání. Nesahat na
 * window.localStorage přímo nikde jinde.)
 */

export function getStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Úložiště nedostupné (privátní režim / blokované sledování) — tiše ignorujeme.
  }
}

export function removeStored(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // viz setStored
  }
}
