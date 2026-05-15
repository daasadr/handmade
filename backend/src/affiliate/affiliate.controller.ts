import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  @Get()
  getAll() {
    return this.affiliateService.getAll();
  }

  @Post(':id/click')
  recordClick(@Param('id') id: string) {
    return this.affiliateService.recordClick(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateAffiliateLinkDto) {
    return this.affiliateService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateAffiliateLinkDto>) {
    return this.affiliateService.update(id, dto);
  }
}
