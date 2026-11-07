import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';

export interface EtsyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface PendingAuth {
  verifier: string;
  userId: string;
  expiresAt: number;
}

/**
 * Nízkoúrovňová komunikace s Etsy OAuth 2.0 (Authorization Code + PKCE).
 * Veškerá znalost Etsy OAuth protokolu je schválně jen tady.
 *
 * `client_id` = keystring, `client_secret` = shared secret. Oboje je v jednom
 * env `ETSY_API_KEY="keystring:shared_secret"` (stejně to čte EtsyService) —
 * rozdělíme na první dvojtečce. Tajemství nikdy nelogujeme.
 */
@Injectable()
export class EtsyOAuthService {
  private readonly logger = new Logger(EtsyOAuthService.name);
  private readonly tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';
  private readonly connectUrl = 'https://www.etsy.com/oauth/connect';
  private readonly scope = 'listings_r listings_w';

  // State store PKCE verifierů. In-memory stačí pro jednu instanci backendu
  // (jako InFlightLock u analyze). TTL 10 min — po přihlášení na Etsy se tvůrce
  // vrací rychle; starší stavy jsou mrtvé a čistíme je líně.
  private readonly pending = new Map<string, PendingAuth>();
  private readonly stateTtlMs = 10 * 60 * 1000;

  isConfigured(): boolean {
    return !!process.env.ETSY_API_KEY;
  }

  /** Keystring pro hlavičku `x-api-key` u aplikačních volání Etsy. */
  getClientId(): string {
    return this.credentials().clientId;
  }

  private credentials(): { clientId: string; clientSecret: string } {
    const raw = process.env.ETSY_API_KEY ?? '';
    const idx = raw.indexOf(':');
    // Keystring je část před dvojtečkou; shared secret za ní (může sám obsahovat
    // dvojtečku, proto dělíme jen na PRVNÍ výskyt).
    return idx === -1
      ? { clientId: raw, clientSecret: '' }
      : { clientId: raw.slice(0, idx), clientSecret: raw.slice(idx + 1) };
  }

  /** Authorize URL + uložení PKCE verifieru pod `state`. */
  buildAuthorizeUrl(userId: string, redirectUri: string): string {
    this.sweepExpired();
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const state = randomBytes(24).toString('base64url');
    this.pending.set(state, {
      verifier,
      userId,
      expiresAt: Date.now() + this.stateTtlMs,
    });

    const { clientId } = this.credentials();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: this.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    return `${this.connectUrl}?${params.toString()}`;
  }

  /** Ověří a spotřebuje `state` (jednorázově, CSRF ochrana). */
  consumeState(state: string): PendingAuth | null {
    const entry = this.pending.get(state);
    if (!entry) return null;
    this.pending.delete(state);
    if (entry.expiresAt < Date.now()) return null;
    return entry;
  }

  /** Výměna authorization code za tokeny. */
  async exchangeCode(
    code: string,
    verifier: string,
    redirectUri: string,
  ): Promise<EtsyTokenResponse> {
    const { clientId } = this.credentials();
    return this.tokenRequest({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
    });
  }

  /** Obnova access tokenu z refresh tokenu. Etsy může vrátit NOVÝ refresh token. */
  async refreshAccessToken(refreshToken: string): Promise<EtsyTokenResponse> {
    const { clientId } = this.credentials();
    return this.tokenRequest({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });
  }

  private async tokenRequest(
    body: Record<string, string>,
  ): Promise<EtsyTokenResponse> {
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      // Nelogujeme tělo requestu (obsahuje code/refresh token). Jen status.
      const detail = await res.text().catch(() => '');
      this.logger.warn(`Etsy token endpoint vrátil ${res.status}`);
      throw new Error(`etsy_token_${res.status}:${detail.slice(0, 200)}`);
    }
    const data = (await res.json()) as EtsyTokenResponse;
    if (!data?.access_token || !data?.refresh_token) {
      throw new Error('etsy_token_malformed');
    }
    return data;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [state, entry] of this.pending) {
      if (entry.expiresAt < now) this.pending.delete(state);
    }
  }
}
