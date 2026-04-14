import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakerProfile } from './maker-profile.entity';
import { MakersController } from './makers.controller';
import { MakersService } from './makers.service';

@Module({
  imports: [TypeOrmModule.forFeature([MakerProfile])],
  controllers: [MakersController],
  providers: [MakersService],
  exports: [MakersService],
})
export class MakersModule {}
