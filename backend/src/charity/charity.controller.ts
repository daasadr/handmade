import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CharityService } from './charity.service';
import { CreateCharityRecordDto } from './dto/create-charity-record.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('charity')
export class CharityController {
  constructor(private charityService: CharityService) {}

  @Get()
  getCurrent() {
    return this.charityService.getCurrent();
  }

  @Get('history')
  getHistory() {
    return this.charityService.getHistory();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCharityRecordDto) {
    return this.charityService.create(dto);
  }
}
