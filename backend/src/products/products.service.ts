import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../users/user.entity';
import { MakersService } from '../makers/makers.service';

export class CreateProductDto {
  titleOriginal: string;
  descriptionOriginal: string;
  priceOriginal?: number;
  category?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private makersService: MakersService,
  ) {}

  private async getMakerProfile(user: User) {
    const profile = await this.makersService.findById(user.id);
    // Hledáme profil dle userId
    const found = await this.makersService.getProfile(user).catch(() => null);
    if (!found) throw new NotFoundException('Nejdříve si vytvořte maker profil');
    return found;
  }

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
}
