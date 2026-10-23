import { InFlightLock } from './in-flight-lock';

/**
 * Testy zámku proti souběžnému běhu (dvojklik na analýzu). Rozhodnutí „pustit /
 * nepustit" je přesně to, co má smysl testovat (bod 07 příručky).
 */
describe('InFlightLock', () => {
  it('pustí první acquire a zablokuje druhý se stejným klíčem', () => {
    const lock = new InFlightLock();
    expect(lock.acquire('a')).toBe(true);
    expect(lock.acquire('a')).toBe(false); // dvojklik → odmítnuto
  });

  it('po release jde klíč zamknout znovu', () => {
    const lock = new InFlightLock();
    lock.acquire('a');
    lock.release('a');
    expect(lock.acquire('a')).toBe(true);
  });

  // Různé produkty/platformy se nesmí navzájem blokovat.
  it('různé klíče se neovlivňují', () => {
    const lock = new InFlightLock();
    expect(lock.acquire('user:p1:etsy')).toBe(true);
    expect(lock.acquire('user:p1:amazon')).toBe(true);
    expect(lock.acquire('user:p2:etsy')).toBe(true);
  });

  it('release neexistujícího klíče nevadí', () => {
    const lock = new InFlightLock();
    expect(() => lock.release('nope')).not.toThrow();
  });
});
