import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService, CreateProductDto } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { S3Service } from '../common/s3/s3.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private s3Service: S3Service,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.productsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.findOne(id, user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateProductDto) {
    return this.productsService.create(user, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, user, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  async uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('Žádné soubory nebyly nahrány');
    const product = await this.productsService.findOne(id, user);
    const urls = await Promise.all(
      files.map((f) => this.s3Service.uploadFile(f, `products/${product.id}`)),
    );
    return this.productsService.addImages(product.id, urls);
  }
}
