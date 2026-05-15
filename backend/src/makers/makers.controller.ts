import {
  Controller, Get, Post, Patch, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MakersService, CreateMakerProfileDto } from './makers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { S3Service } from '../common/s3/s3.service';

@Controller('makers')
@UseGuards(JwtAuthGuard)
export class MakersController {
  constructor(
    private makersService: MakersService,
    private s3Service: S3Service,
  ) {}

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

  @Post('profile/image')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadProfileImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Žádný soubor nebyl nahrán');
    const url = await this.s3Service.uploadFile(file, `profiles/${user.id}`);
    return this.makersService.updateProfileImage(user, url);
  }
}
