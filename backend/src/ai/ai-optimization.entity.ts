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

  @Column({ nullable: true, type: 'int', default: 0 })
  competitivenessScore: number;

  @Column({ nullable: true })
  aiModelUsed: string;

  @Column({ nullable: true })
  platform: string; // 'etsy' | 'amazon'

  @CreateDateColumn()
  createdAt: Date;
}
