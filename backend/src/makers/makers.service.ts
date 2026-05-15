import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { MakerProfile } from './maker-profile.entity';
import { User } from '../users/user.entity';

export class CreateMakerProfileDto {
  @IsString()
  brandName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}

@Injectable()
export class MakersService {
  constructor(
    @InjectRepository(MakerProfile)
    private profileRepo: Repository<MakerProfile>,
  ) {}

  async getProfile(user: User) {
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('Profil nenalezen');
    return profile;
  }

  async createProfile(user: User, dto: CreateMakerProfileDto) {
    const profile = this.profileRepo.create({ ...dto, userId: user.id });
    return this.profileRepo.save(profile);
  }

  async updateProfile(user: User, dto: Partial<CreateMakerProfileDto>) {
    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException('Profil nenalezen');
    Object.assign(profile, dto);
    return this.profileRepo.save(profile);
  }

  async findById(id: string) {
    return this.profileRepo.findOne({ where: { id } });
  }

  async updateProfileImage(user: User, imageUrl: string) {
    const profile = await this.getProfile(user);
    profile.profileImageUrl = imageUrl;
    return this.profileRepo.save(profile);
  }
}
