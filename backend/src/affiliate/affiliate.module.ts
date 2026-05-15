import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { AffiliateController } from './affiliate.controller';
import { AffiliateService } from './affiliate.service';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateLink])],
  controllers: [AffiliateController],
  providers: [AffiliateService],
})
export class AffiliateModule {}
