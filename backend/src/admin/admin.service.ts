import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
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
      select: ['id', 'email', 'role', 'plan', 'isFoundingMember', 'isVip', 'vipUntil',
               'emailVerified', 'aiUsageThisMonth', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Uživatel nenalezen');

    // Degradace posledního admina by uzavřela administraci všem a šla by
    // vrátit jen zásahem do databáze.
    if (
      dto.role === UserRole.MAKER &&
      user.role === UserRole.ADMIN &&
      (await this.usersRepo.count({ where: { role: UserRole.ADMIN } })) <= 1
    ) {
      throw new BadRequestException(
        'Nelze odebrat roli poslednímu administrátorovi. Nejdřív povyšte jiného uživatele.',
      );
    }

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

    // VIP účty se ve statistikách nesmí míchat s platícími — jsou zdarma.
    const vipCount = await this.usersRepo.count({ where: { isVip: true } });

    return { totalUsers, totalProducts, planCounts, vipCount };
  }
}
