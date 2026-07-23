import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('ai_optimizations')
export class AiOptimization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.optimizations, { onDelete: 'CASCADE' })
  @JoinColumn()
  product: Product;

  @Column()
  productId: string;

  @Column({ nullable: true })
  titleOptimized: string;

  @Column({ nullable: true, type: 'text' })
  descriptionOptimized: string;

  @Column({ type: 'jsonb', default: '[]' })
  keywords: string[];

  @Column({ nullable: true, type: 'text' })
  pricingRecommendation: string;

  @Column({ nullable: true })
  titleCzech: string;

  @Column({ nullable: true, type: 'text' })
  descriptionCzech: string;

  @Column({ nullable: true, type: 'text' })
  pricingRecommendationCzech: string;

  @Column({ nullable: true, type: 'int', default: 0 })
  competitivenessScore: number;

  /** Zdroj skóre: 'market' = spočítáno z reálné konkurence (Etsy), 'ai' = odhad AI. */
  @Column({ nullable: true })
  scoreSource: 'ai' | 'market';

  // --- Snímek konkurence (jen když je nakonfigurováno Etsy API a platform=etsy) ---
  @Column({ nullable: true, type: 'int' })
  competitorCount: number;

  @Column({ nullable: true, type: 'real' })
  priceMin: number;

  @Column({ nullable: true, type: 'real' })
  priceMedian: number;

  @Column({ nullable: true, type: 'real' })
  priceMax: number;

  @Column({ nullable: true })
  priceCurrency: string;

  @Column({ type: 'jsonb', default: '[]' })
  competitorTags: string[];

  @Column({ nullable: true })
  aiModelUsed: string;

  @Column({ nullable: true })
  platform: string; // 'etsy' | 'amazon'

  @CreateDateColumn()
  createdAt: Date;
}
