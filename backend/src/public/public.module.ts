import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakerProfile } from '../makers/maker-profile.entity';
import { Product } from '../products/product.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TypeOrmModule.forFeature([MakerProfile, Product])],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
