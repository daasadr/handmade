/**
 * Jednoduchý zámek na souběžně běžící operace v rámci jednoho procesu.
 *
 * `acquire(key)` vrátí true a klíč zamkne, pokud volný; false, pokud už běží.
 * `release(key)` klíč uvolní (volat v `finally`, ať pád uvnitř zámek nezablokuje).
 *
 * Záměrně in-memory: stačí pro jednu instanci backendu. Při horizontálním
 * škálování (více kontejnerů) by zámek musel být v DB nebo Redisu — tohle mezi
 * instancemi nekoordinuje. (Viz CLAUDE.md 15.4.)
 */
export class InFlightLock {
  private readonly active = new Set<string>();

  acquire(key: string): boolean {
    if (this.active.has(key)) return false;
    this.active.add(key);
    return true;
  }

  release(key: string): void {
    this.active.delete(key);
  }

  isLocked(key: string): boolean {
    return this.active.has(key);
  }
}
