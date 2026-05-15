import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  getUsers() {
    return this.usersRepo.find({
      select: ['id', 'email', 'role', 'plan', 'isFoundingMember', 'emailVerified',
               'aiUsageThisMonth', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Uživatel nenalezen');
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async getStats() {
    const [totalUsers, totalProducts] = await Promise.all([
      this.usersRepo.count(),
      this.productRepo.count(),
    ]);

    const planCounts = await this.usersRepo
      .createQueryBuilder('u')
      .select('u.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.plan')
      .getRawMany();

    return { totalUsers, totalProducts, planCounts };
  }
}
