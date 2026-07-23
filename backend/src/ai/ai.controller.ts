import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService, type Platform } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiService: AiService,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  @Post(':id/analyze')
  async analyze(
    @Param('id') productId: string,
    @Query('platform') platform: Platform = 'etsy',
    @CurrentUser() user: User,
  ) {
    const result = await this.aiService.analyze(productId, user, platform);

    await this.usersRepo.update(user.id, {
      aiUsageThisMonth: result.newUsage,
      aiUsageResetAt: result.needsReset ? new Date() : user.aiUsageResetAt,
    });

    // Surová data konkurence jen přechodně k jednorázovému zobrazení — neukládá
    // se do DB, takže je vracíme přilepená k odpovědi (ne součást entity).
    return { ...result.optimization, competition: result.competition };
  }

  @Get(':id/optimizations')
  getOptimizations(@Param('id') productId: string) {
    return this.aiService.getOptimizations(productId);
  }
}
