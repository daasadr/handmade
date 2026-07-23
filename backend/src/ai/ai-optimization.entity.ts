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

  /**
   * Textový závěr z dat konkurence (ukládá se). Surová data z Etsy (ceny, tagy,
   * počty) se ZÁMĚRNĚ neukládají — kvůli Etsy API Terms. Uživateli se ukážou
   * jen jednou, přechodně v odpovědi na analýzu.
   */
  @Column({ nullable: true, type: 'text' })
  marketConclusion: string;

  @Column({ nullable: true })
  aiModelUsed: string;

  @Column({ nullable: true })
  platform: string; // 'etsy' | 'amazon'

  @CreateDateColumn()
  createdAt: Date;
}
