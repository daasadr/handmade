import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { EtsyConnectService } from './etsy-connect.service';
import { EtsyListingService } from './etsy-listing.service';

/**
 * Etsy OAuth propojení + odeslání konceptu.
 *
 * POZOR na guardy: `/etsy/oauth/callback` je ZÁMĚRNĚ bez JwtAuthGuard — chodí
 * na něj prohlížeč přesměrovaný z Etsy, bez našeho JWT v hlavičce. Identitu
 * uživatele nese `state` (mapuje se na userId, uloženo při startu, CSRF ochrana).
 * Ostatní endpointy JWT vyžadují.
 */
@Controller('etsy')
export class EtsyConnectController {
  private readonly logger = new Logger(EtsyConnectController.name);

  constructor(private readonly connect: EtsyConnectService) {}

  private redirectUri(): string {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${base}/api/etsy/oauth/callback`;
  }

  /** Vrátí authorize URL; frontend na ni přesměruje prohlížeč. */
  @Get('oauth/start')
  @UseGuards(JwtAuthGuard)
  start(@CurrentUser() user: User): { url: string } {
    return { url: this.connect.buildAuthorizeUrl(user.id, this.redirectUri()) };
  }

  /** Návrat z Etsy. Dokončí propojení a přesměruje zpět do profilu. */
  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      if (!code || !state) throw new Error('missing code/state');
      await this.connect.completeConnection(state, code, this.redirectUri());
      res.redirect(`${base}/profile?etsy=connected`);
    } catch (err) {
      // Nelogujeme code (tajemství). Jen že callback selhal.
      this.logger.warn(
        `Etsy OAuth callback selhal: ${err instanceof Error ? err.message : 'err'}`,
      );
      res.redirect(`${base}/profile?etsy=error`);
    }
  }

  @Get('connection')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: User) {
    return this.connect.getStatus(user.id);
  }

  @Delete('connection')
  @UseGuards(JwtAuthGuard)
  async disconnect(@CurrentUser() user: User) {
    await this.connect.disconnect(user.id);
    return { connected: false };
  }
}

/**
 * Odeslání konceptu je logicky u produktu (`/products/:id/etsy-draft`), proto
 * samostatný controller s prefixem `products` (stejně jako AiController).
 */
@Controller('products')
@UseGuards(JwtAuthGuard)
export class EtsyDraftController {
  constructor(private readonly listing: EtsyListingService) {}

  @Post(':id/etsy-draft')
  createDraft(@Param('id') productId: string, @CurrentUser() user: User) {
    return this.listing.createDraft(user, productId);
  }

  /** Ověří, zda je listing na Etsy zveřejněný, a překlopí příznak pro výlohu. */
  @Post(':id/etsy-listing-state')
  syncState(@Param('id') productId: string, @CurrentUser() user: User) {
    return this.listing.syncListingState(user, productId);
  }
}
