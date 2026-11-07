import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'node:crypto';

/**
 * Šifrování dlouhodobých tajemství v klidovém stavu (AES-256-GCM).
 *
 * PROČ: Etsy refresh token je dlouhodobý klíč k obchodu tvůrce — v DB nesmí ležet
 * v plaintextu. Kdyby unikla databáze, samotný refresh token stačí k ovládání
 * jeho listingů. GCM navíc ověří integritu (authtag) — pozměněný ciphertext
 * dešifrování shodí, místo aby vrátil nesmysl.
 *
 * PROČ fail-SAFE (ne fail-fast): Etsy je bonusová funkce (jako konkurence v
 * EtsyService). Když `ETSY_TOKEN_KEY` v .env chybí, NESMÍ to shodit celý backend
 * (jinak by deploy bez klíče sundal i přihlášení). Místo toho `isConfigured()`
 * vrátí false a Etsy endpointy slušně odmítnou „není nakonfigurováno". Rozdíl
 * oproti JWT_SECRET (ten fail-fastuje v main.ts) je záměrný: JWT je jádro, Etsy ne.
 */
@Injectable()
export class TokenCipher {
  private readonly logger = new Logger(TokenCipher.name);
  private readonly key: Buffer | null;

  constructor() {
    const raw = process.env.ETSY_TOKEN_KEY;
    if (!raw || raw.length < 32) {
      // Nezakládáme klíč → funkce je vypnutá. Zalogujeme jednou při startu.
      this.key = null;
      if (raw && raw.length < 32) {
        this.logger.warn(
          'ETSY_TOKEN_KEY je kratší než 32 znaků — Etsy integrace je vypnutá.',
        );
      }
    } else {
      // SHA-256 odvodí přesně 32B klíč bez ohledu na to, jak je env zapsán
      // (hex / base64 / passphrase). Stejná hodnota env = stejný klíč = jde
      // dešifrovat to, co zašifrovala předchozí instance.
      this.key = createHash('sha256').update(raw).digest();
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  /** Formát: iv.tag.ciphertext (base64url), jeden string do textového sloupce. */
  encrypt(plain: string): string {
    if (!this.key) throw new Error('TokenCipher není nakonfigurován');
    const iv = randomBytes(12); // GCM standard: 96bit IV, nový na KAŽDÝ záznam
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      iv.toString('base64url'),
      tag.toString('base64url'),
      enc.toString('base64url'),
    ].join('.');
  }

  decrypt(blob: string): string {
    if (!this.key) throw new Error('TokenCipher není nakonfigurován');
    const [ivB, tagB, dataB] = (blob ?? '').split('.');
    if (!ivB || !tagB || !dataB) {
      throw new Error('Neplatný formát šifrovaného tokenu');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(ivB, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagB, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
