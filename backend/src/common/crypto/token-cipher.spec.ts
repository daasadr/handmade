import { TokenCipher } from './token-cipher';

/**
 * Testujeme rozhodnutí, ne dráty (CLAUDE.md 15.7): že šifra je round-trip, že
 * dvakrát zašifrovaný stejný text dá jiný ciphertext (náhodný IV), že pozměněný
 * ciphertext spadne (GCM integrita) a že bez klíče je funkce vypnutá (fail-safe).
 */
describe('TokenCipher', () => {
  const KEY = 'test-key-aspon-32-znaku-dlouhy-abcdef';

  function withKey(): TokenCipher {
    process.env.ETSY_TOKEN_KEY = KEY;
    return new TokenCipher();
  }

  it('zašifruje a dešifruje zpět stejný text', () => {
    const c = withKey();
    const secret = 'etsy-refresh-token-xyz';
    expect(c.decrypt(c.encrypt(secret))).toBe(secret);
  });

  it('stejný vstup dvakrát dá jiný ciphertext (náhodný IV)', () => {
    const c = withKey();
    expect(c.encrypt('abc')).not.toBe(c.encrypt('abc'));
  });

  it('pozměněný ciphertext neprojde (GCM authtag)', () => {
    const c = withKey();
    const blob = c.encrypt('tajne');
    const parts = blob.split('.');
    // obrátíme poslední znak dat → integrita musí selhat
    const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -1)}${parts[2].endsWith('A') ? 'B' : 'A'}`;
    expect(() => c.decrypt(tampered)).toThrow();
  });

  it('bez klíče je vypnutý (fail-safe) a nešifruje', () => {
    delete process.env.ETSY_TOKEN_KEY;
    const c = new TokenCipher();
    expect(c.isConfigured()).toBe(false);
    expect(() => c.encrypt('x')).toThrow();
  });

  afterAll(() => {
    delete process.env.ETSY_TOKEN_KEY;
  });
});
