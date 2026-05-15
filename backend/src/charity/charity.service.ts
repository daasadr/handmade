import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharityRecord } from './charity-record.entity';
import { CreateCharityRecordDto } from './dto/create-charity-record.dto';

@Injectable()
export class CharityService {
  constructor(
    @InjectRepository(CharityRecord)
    private recordRepo: Repository<CharityRecord>,
  ) {}

  async getCurrent() {
    const latest = await this.recordRepo.findOne({
      order: { createdAt: 'DESC' },
      where: {},
    });
    const total = await this.recordRepo
      .createQueryBuilder('r')
      .select('SUM(r.amountSent)', 'totalDonated')
      .getRawOne();

    return {
      latest,
      totalDonated: Number(total?.totalDonated ?? 0),
    };
  }

  getHistory() {
    return this.recordRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateCharityRecordDto) {
    const record = this.recordRepo.create(dto);
    return this.recordRepo.save(record);
  }
}
