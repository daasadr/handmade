import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EtsyConnection } from './etsy-connection.entity';
import { Product } from '../products/product.entity';
import { AiOptimization } from '../ai/ai-optimization.entity';
import { EtsyOAuthService } from './etsy-oauth.service';
import { EtsyConnectService } from './etsy-connect.service';
import { EtsyListingService } from './etsy-listing.service';
import { TokenCipher } from '../common/crypto/token-cipher';
import {
  EtsyConnectController,
  EtsyDraftController,
} from './etsy-connect.controller';

/**
 * Přímé napojení na Etsy (OAuth + odeslání konceptu listingu).
 * Fail-safe: bez ETSY_API_KEY / ETSY_TOKEN_KEY je funkce vypnutá, zbytek appky jede.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EtsyConnection, Product, AiOptimization]),
  ],
  controllers: [EtsyConnectController, EtsyDraftController],
  providers: [
    EtsyOAuthService,
    EtsyConnectService,
    EtsyListingService,
    TokenCipher,
  ],
})
export class EtsyConnectModule {}
