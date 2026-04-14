import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { MakersService, CreateMakerProfileDto } from './makers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('makers')
@UseGuards(JwtAuthGuard)
export class MakersController {
  constructor(private makersService: MakersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.makersService.getProfile(user);
  }

  @Post('profile')
  createProfile(@CurrentUser() user: User, @Body() dto: CreateMakerProfileDto) {
    return this.makersService.createProfile(user, dto);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: Partial<CreateMakerProfileDto>) {
    return this.makersService.updateProfile(user, dto);
  }
}
