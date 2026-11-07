import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MakerProfile } from '../makers/maker-profile.entity';
import { ProductImage } from './product-image.entity';
import { AiOptimization } from '../ai/ai-optimization.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ANALYZED = 'analyzed',
  COMPLETED = 'completed',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MakerProfile, (maker) => maker.products, { onDelete: 'CASCADE' })
  @JoinColumn()
  maker: MakerProfile;

  @Column()
  makerId: string;

  @Column()
  titleOriginal: string;

  @Column({ type: 'text' })
  descriptionOriginal: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  priceOriginal: number;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  // Pro Etsy přímou integraci
  @Column({ nullable: true })
  etsyListingId: string;

  /**
   * Je Etsy listing ZVEŘEJNĚNÝ (state='active'), ne jen koncept? Push zakládá
   * koncept, který NENÍ veřejně koupitelný — odkaz `etsy.com/listing/{id}` ožije
   * až po zveřejnění tvůrcem. Výloha proto „Koupit na Etsy" ukáže jen když je
   * `true`. Příznak překlápí `syncListingState` z reálného stavu listingu
   * (ukládáme jen odvozený boolean, ne obsah z Etsy — Etsy API Terms).
   */
  @Column({ default: false })
  etsyListingActive: boolean;

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => AiOptimization, (opt) => opt.product)
  optimizations: AiOptimization[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
