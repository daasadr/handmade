import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MakersModule } from './makers/makers.module';
import { ProductsModule } from './products/products.module';
import { AiModule } from './ai/ai.module';
import { CharityModule } from './charity/charity.module';
import { AdminModule } from './admin/admin.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { EmailModule } from './common/email/email.module';
import { S3Module } from './common/s3/s3.module';

import { User } from './users/user.entity';
import { MakerProfile } from './makers/maker-profile.entity';
import { Product } from './products/product.entity';
import { ProductImage } from './products/product-image.entity';
import { AiOptimization } from './ai/ai-optimization.entity';
import { AffiliateLink } from './affiliate/affiliate-link.entity';
import { CharityRecord } from './charity/charity-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, MakerProfile, Product, ProductImage, AiOptimization, AffiliateLink, CharityRecord],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    EmailModule,
    S3Module,
    AuthModule,
    MakersModule,
    ProductsModule,
    AiModule,
    CharityModule,
    AdminModule,
    AffiliateModule,
  ],
})
export class AppModule {}
