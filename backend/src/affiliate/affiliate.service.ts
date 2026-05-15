import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from './affiliate-link.entity';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateLink)
    private linkRepo: Repository<AffiliateLink>,
  ) {}

  getAll() {
    return this.linkRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateAffiliateLinkDto) {
    const link = this.linkRepo.create(dto);
    return this.linkRepo.save(link);
  }

  async update(id: string, dto: Partial<CreateAffiliateLinkDto>) {
    const link = await this.linkRepo.findOne({ where: { id } });
    if (!link) throw new NotFoundException('Affiliate odkaz nenalezen');
    Object.assign(link, dto);
    return this.linkRepo.save(link);
  }

  async recordClick(id: string) {
    const link = await this.linkRepo.findOne({ where: { id } });
    if (!link) throw new NotFoundException('Affiliate odkaz nenalezen');
    link.clickCount += 1;
    await this.linkRepo.save(link);
    return { url: link.url };
  }
}
