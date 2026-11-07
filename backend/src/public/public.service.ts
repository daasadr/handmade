import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MakerProfile } from '../makers/maker-profile.entity';
import { Product, ProductStatus } from '../products/product.entity';

/**
 * Veřejná (nepřihlášená) data pro výlohu /vyrobci. KLÍČOVÉ: ven posíláme jen
 * bezpečná pole přes explicitní allowlist mapování (makerCard / makerProfilePublic
 * / productCard) — nikdy ne celou entitu (žádný e-mail, kvóta, interní stav).
 * Neveřejní tvůrci (isPublic=false) se nevrací vůbec.
 */
@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(MakerProfile)
    private profileRepo: Repository<MakerProfile>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async listMakers() {
    const makers = await this.profileRepo.find({
      where: { isPublic: true },
      order: { updatedAt: 'DESC' },
    });
    return makers.map((m) => this.makerCard(m));
  }

  async getMaker(id: string) {
    const maker = await this.profileRepo.findOne({ where: { id, isPublic: true } });
    if (!maker) throw new NotFoundException('Tvůrce nenalezen');

    const products = await this.productRepo.find({
      where: { makerId: maker.id },
      relations: ['images', 'optimizations'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...this.makerProfilePublic(maker),
      // Ve výloze jen hotové produkty s obrázkem (koncepty se neukazují).
      products: products
        .filter((p) => p.status !== ProductStatus.DRAFT && (p.images?.length ?? 0) > 0)
        .map((p) => this.productCard(p)),
    };
  }

  private makerCard(m: MakerProfile) {
    return {
      id: m.id,
      brandName: m.brandName,
      motto: m.motto ?? null,
      profileImageUrl: m.profileImageUrl ?? null,
    };
  }

  private makerProfilePublic(m: MakerProfile) {
    return {
      id: m.id,
      brandName: m.brandName,
      motto: m.motto ?? null,
      bio: m.bio ?? null,
      storyMode: m.storyMode ?? null,
      storyAnswers: m.storyAnswers ?? {},
      storyImages: m.storyImages ?? {},
      storyHtml: m.storyHtml ?? null,
      profileImageUrl: m.profileImageUrl ?? null,
      videoUrl: m.videoUrl ?? null,
      marketplaceLinks: m.marketplaceLinks ?? {},
    };
  }

  private productCard(p: Product) {
    const opt = (p.optimizations ?? [])[0];
    return {
      id: p.id,
      title: opt?.titleOptimized || p.titleOriginal,
      category: p.category ?? null,
      price: p.priceOriginal ?? null,
      imageUrl: p.images?.[0]?.imageUrl ?? null,
      etsyListingId: p.etsyListingId ?? null,
    };
  }
}
