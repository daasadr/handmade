import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { User } from '../users/user.entity';
import { MakersService } from '../makers/makers.service';
import { RemoveBgService } from '../common/removebg/removebg.service';
import { S3Service } from '../common/s3/s3.service';

export class CreateProductDto {
  @IsString()
  titleOriginal: string;

  @IsString()
  descriptionOriginal: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceOriginal?: number;

  @IsOptional()
  @IsString()
  category?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private imageRepo: Repository<ProductImage>,
    private makersService: MakersService,
    private removeBgService: RemoveBgService,
    private s3Service: S3Service,
  ) {}

  async findAll(user: User) {
    const profile = await this.makersService.getProfile(user);
    return this.productRepo.find({
      where: { makerId: profile.id },
      relations: ['images', 'optimizations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User) {
    const profile = await this.makersService.getProfile(user);
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'optimizations'],
    });
    if (!product) throw new NotFoundException('Produkt nenalezen');
    if (product.makerId !== profile.id) throw new ForbiddenException();
    return product;
  }

  async create(user: User, dto: CreateProductDto) {
    const profile = await this.makersService.getProfile(user);
    const product = this.productRepo.create({ ...dto, makerId: profile.id });
    return this.productRepo.save(product);
  }

  async update(id: string, user: User, dto: Partial<CreateProductDto>) {
    const product = await this.findOne(id, user);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string, user: User) {
    const product = await this.findOne(id, user);
    await this.productRepo.remove(product);
    return { message: 'Produkt byl smazán' };
  }

  async addImages(productId: string, urls: string[]) {
    const images = urls.map((imageUrl, index) =>
      this.imageRepo.create({ productId, imageUrl, orderIndex: index }),
    );
    await this.imageRepo.save(images);
    return this.productRepo.findOne({
      where: { id: productId },
      relations: ['images', 'optimizations'],
    });
  }

  async removeBg(productId: string, imageId: string, user: User) {
    await this.findOne(productId, user);
    const image = await this.imageRepo.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Obrázek nenalezen');

    const buffer = await this.removeBgService.removeBackground(image.imageUrl);
    const key = `products/${productId}/${randomUUID()}_nobg.png`;
    image.imageUrl = await this.s3Service.uploadBuffer(buffer, key, 'image/png');
    await this.imageRepo.save(image);

    return this.productRepo.findOne({
      where: { id: productId },
      relations: ['images', 'optimizations'],
    });
  }
}
