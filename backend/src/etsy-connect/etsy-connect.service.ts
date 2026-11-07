import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EtsyConnection } from './etsy-connection.entity';
import { EtsyOAuthService } from './etsy-oauth.service';
import { TokenCipher } from '../common/crypto/token-cipher';

const APPLICATION_BASE = 'https://openapi.etsy.com/v3/application';

/**
 * Orchestrace propojení Etsy: spojuje OAuth (EtsyOAuthService), šifrování
 * (TokenCipher) a úložiště (EtsyConnection). Zbytek aplikace sem chodí pro
 * platný access token a shop id, aniž by znal detaily OAuth.
 *
 * Fail-safe: když Etsy není nakonfigurované (chybí ETSY_API_KEY nebo
 * ETSY_TOKEN_KEY), vyhodíme ČEKATELNOU chybu (503 „není nakonfigurováno"),
 * NIKDY 401 (CLAUDE.md 15.3). Zbytek appky tím netrpí.
 */
@Injectable()
export class EtsyConnectService {
  private readonly logger = new Logger(EtsyConnectService.name);

  // Cache krátkodobého access tokenu v paměti (NE v DB). Ušetří obnovu při
  // každém volání v rámci platnosti. Per instance backendu.
  private readonly accessCache = new Map<
    string,
    { token: string; shopId: string; expiresAt: number }
  >();

  constructor(
    @InjectRepository(EtsyConnection)
    private readonly repo: Repository<EtsyConnection>,
    private readonly oauth: EtsyOAuthService,
    private readonly cipher: TokenCipher,
  ) {}

  /** Je integrace vůbec zapnutá (klíč + šifrovací klíč)? */
  isEnabled(): boolean {
    return this.oauth.isConfigured() && this.cipher.isConfigured();
  }

  private assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Propojení s Etsy zatím není na serveru nakonfigurováno.',
      );
    }
  }

  buildAuthorizeUrl(userId: string, redirectUri: string): string {
    this.assertEnabled();
    return this.oauth.buildAuthorizeUrl(userId, redirectUri);
  }

  /** Dokončení OAuth: výměna kódu, zjištění obchodu, uložení šifrovaného tokenu. */
  async completeConnection(
    state: string,
    code: string,
    redirectUri: string,
  ): Promise<void> {
    this.assertEnabled();
    const pending = this.oauth.consumeState(state);
    if (!pending) {
      // Neznámý/prošlý state = možný CSRF nebo pozdní návrat. Čekatelný stav.
      throw new BadRequestException(
        'Propojení s Etsy vypršelo nebo je neplatné. Zkuste to prosím znovu.',
      );
    }

    const tokens = await this.oauth.exchangeCode(
      code,
      pending.verifier,
      redirectUri,
    );
    // Etsy user id je část access tokenu před tečkou.
    const etsyUserId = tokens.access_token.split('.')[0];
    const shopId = await this.fetchShopId(etsyUserId, tokens.access_token);

    const existing = await this.repo.findOne({
      where: { userId: pending.userId },
    });
    const row = existing ?? this.repo.create({ userId: pending.userId });
    row.etsyUserId = etsyUserId;
    row.shopId = shopId;
    row.refreshTokenEnc = this.cipher.encrypt(tokens.refresh_token);
    row.scopes = 'listings_r listings_w';
    await this.repo.save(row);

    // Přednahrajeme access token do cache, ať první odeslání nemusí hned obnovovat.
    this.accessCache.set(pending.userId, {
      token: tokens.access_token,
      shopId,
      expiresAt: Date.now() + (tokens.expires_in - 60) * 1000,
    });
  }

  /** Platný access token + shop id pro daného uživatele (obnoví, pokud třeba). */
  async getAccessContext(
    userId: string,
  ): Promise<{ accessToken: string; shopId: string }> {
    this.assertEnabled();
    const cached = this.accessCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return { accessToken: cached.token, shopId: cached.shopId };
    }

    const conn = await this.repo.findOne({ where: { userId } });
    if (!conn) {
      throw new BadRequestException(
        'Účet Etsy není propojen. Propojte ho prosím v profilu.',
      );
    }

    let tokens;
    try {
      const refresh = this.cipher.decrypt(conn.refreshTokenEnc);
      tokens = await this.oauth.refreshAccessToken(refresh);
    } catch (err) {
      this.logger.warn(
        `Obnova Etsy tokenu selhala pro usera ${userId}: ${err instanceof Error ? err.message : 'err'}`,
      );
      throw new BadRequestException(
        'Propojení s Etsy vypršelo. Propojte účet prosím znovu.',
      );
    }

    // Etsy může při obnově vrátit NOVÝ refresh token — uložíme ho (rotace).
    conn.refreshTokenEnc = this.cipher.encrypt(tokens.refresh_token);
    await this.repo.save(conn);

    this.accessCache.set(userId, {
      token: tokens.access_token,
      shopId: conn.shopId,
      expiresAt: Date.now() + (tokens.expires_in - 60) * 1000,
    });
    return { accessToken: tokens.access_token, shopId: conn.shopId };
  }

  async getStatus(
    userId: string,
  ): Promise<{ connected: boolean; shopId?: string }> {
    if (!this.isEnabled()) return { connected: false };
    const conn = await this.repo.findOne({ where: { userId } });
    return conn ? { connected: true, shopId: conn.shopId } : { connected: false };
  }

  async disconnect(userId: string): Promise<void> {
    this.accessCache.delete(userId);
    await this.repo.delete({ userId });
  }

  /** Zjistí shop id vlastníka účtu (getShopByOwnerUserId). */
  private async fetchShopId(
    etsyUserId: string,
    accessToken: string,
  ): Promise<string> {
    const res = await fetch(`${APPLICATION_BASE}/users/${etsyUserId}/shops`, {
      headers: {
        'x-api-key': this.oauth.getClientId(),
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Nepodařilo se načíst váš Etsy obchod. Zkuste to prosím znovu.',
      );
    }
    const data: any = await res.json();
    // Endpoint vrací buď jeden obchod, nebo { results: [...] } dle verze — ošetříme obojí.
    const shopId = data?.shop_id ?? data?.results?.[0]?.shop_id;
    if (!shopId) {
      throw new ServiceUnavailableException(
        'K tomuto Etsy účtu se nenašel žádný obchod.',
      );
    }
    return String(shopId);
  }
}
