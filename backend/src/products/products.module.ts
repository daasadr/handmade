import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MakersModule } from '../makers/makers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), MakersModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
