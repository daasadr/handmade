import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharityRecord } from './charity-record.entity';
import { CharityController } from './charity.controller';
import { CharityService } from './charity.service';

@Module({
  imports: [TypeOrmModule.forFeature([CharityRecord])],
  controllers: [CharityController],
  providers: [CharityService],
})
export class CharityModule {}
