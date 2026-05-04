import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AiOptimization } from './ai-optimization.entity';
import { Product, ProductStatus } from '../products/product.entity';
import { User, UserPlan } from '../users/user.entity';

// Měsíční limity dle tarifu
const PLAN_LIMITS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 5,
  [UserPlan.MINI]: 30,
  [UserPlan.MIDI]: 150,
  [UserPlan.MAX]: 99999,
};

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor(
    @InjectRepository(AiOptimization)
    private optimizationRepo: Repository<AiOptimization>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyze(productId: string, user: User, platform: 'etsy' | 'amazon' = 'etsy') {
    // Kontrola měsíční kvóty
    const limit = PLAN_LIMITS[user.plan];
    const now = new Date();
    const needsReset =
      !user.aiUsageResetAt ||
      user.aiUsageResetAt.getMonth() !== now.getMonth() ||
      user.aiUsageResetAt.getFullYear() !== now.getFullYear();

    const currentUsage = needsReset ? 0 : user.aiUsageThisMonth;

    if (currentUsage >= limit) {
      throw new BadRequestException(
        `Dosáhli jste měsíčního limitu ${limit} optimalizací pro váš tarif. Upgradujte plán pro více optimalizací.`,
      );
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produkt nenalezen');

    const platformInstructions =
      platform === 'etsy'
        ? 'Etsy marketplace (focus on handmade, authentic, artisan qualities; use Etsy SEO best practices)'
        : 'Amazon Handmade (focus on quality, materials, dimensions; use Amazon search optimization)';

    const prompt = `You are an expert in optimizing product listings for handmade marketplaces.

Optimize this handmade product listing for ${platformInstructions}:
- Title: ${product.titleOriginal}
- Description: ${product.descriptionOriginal}
- Category: ${product.category || 'not specified'}
- Current Price: ${product.priceOriginal ? `${product.priceOriginal} EUR` : 'not specified'}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "optimized_title": "SEO-optimized title, max 140 chars",
  "optimized_description": "Natural, authentic description with keywords, 150-300 words",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10", "keyword11", "keyword12", "keyword13"],
  "pricing_recommendation": "Brief pricing strategy advice in 2-3 sentences",
  "competitiveness_score": 75
}`;

    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new BadRequestException('Neočekávaná odpověď AI');

    let parsed: any;
    try {
      // Claude někdy obalí JSON do markdown bloků — extrahujeme čistý JSON
      const raw = content.text.trim();
      const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(jsonText);
    } catch {
      throw new BadRequestException('AI vrátila neplatný formát odpovědi');
    }

    const optimization = this.optimizationRepo.create({
      productId,
      titleOptimized: parsed.optimized_title,
      descriptionOptimized: parsed.optimized_description,
      keywords: parsed.keywords || [],
      pricingRecommendation: parsed.pricing_recommendation,
      competitivenessScore: parsed.competitiveness_score,
      aiModelUsed: 'claude-haiku-4-5',
      platform,
    });
    await this.optimizationRepo.save(optimization);

    await this.productRepo.update(productId, { status: ProductStatus.ANALYZED });

    return {
      optimization,
      needsReset,
      newUsage: currentUsage + 1,
    };
  }

  async getOptimizations(productId: string) {
    return this.optimizationRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
