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
    const shopId = await this.fetchShopId(tokens.access_token);

    const existing = await this.repo.findOne({
      where: { userId: pending.userId },
    });
    const row = existing ?? this.repo.create({ userId: pending.userId });
    row.etsyUserId = etsyUserId;
    row.shopId = shopId;
    row.refreshTokenEnc = this.cipher.encrypt(tokens.refresh_token);
    row.scopes = this.oauth.getScope();
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

  /**
   * Zjistí shop id ověřeného uživatele přes getMe (`/users/me` → { user_id, shop_id }).
   *
   * PROČ getMe a ne getShopByOwnerUserId (`/users/{id}/shops`): druhý endpoint při
   * propojení vracel chybu („Nepodařilo se načíst obchod", 403/404) — je citlivý na
   * odvození user_id z tokenu. getMe je kanonické „kdo jsem + můj obchod" a vrací
   * shop_id přímo. Vyžaduje scope shops_r (proto o něj žádáme, viz EtsyOAuthService).
   */
  private async fetchShopId(accessToken: string): Promise<string> {
    const res = await fetch(`${APPLICATION_BASE}/users/me`, {
      headers: {
        'x-api-key': this.oauth.getClientId(),
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // Tělo getMe je jen { user_id, shop_id } nebo chybová hláška — žádné tajemství.
      // Logujeme status + útržek těla, ať je příští selhání diagnostikovatelné.
      const body = await res.text().catch(() => '');
      this.logger.warn(`Etsy getMe vrátil ${res.status}: ${body.slice(0, 300)}`);
      throw new ServiceUnavailableException(
        'Nepodařilo se načíst váš Etsy účet. Zkuste to prosím znovu.',
      );
    }
    const data: any = await res.json();
    const shopId = data?.shop_id;
    if (!shopId) {
      // Účet existuje, ale nemá otevřený Etsy obchod — čekatelný stav, poradíme co dál.
      throw new BadRequestException(
        'Tento Etsy účet nemá otevřený obchod (shop). Přihlas se účtem, který má na Etsy založený obchod.',
      );
    }
    return String(shopId);
  }
}
