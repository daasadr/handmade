import { Module } from '@nestjs/common';
import { EtsyService } from './etsy.service';

@Module({
  providers: [EtsyService],
  exports: [EtsyService],
})
export class EtsyModule {}
