import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

@Entity('maker_profiles')
export class MakerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.makerProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  brandName: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  /** Oblíbený citát / motto pod jménem tvůrce. */
  @Column({ nullable: true, type: 'text' })
  motto: string;

  /**
   * Odpovědi na řízené otázky šablony → složí se v souvislý příběh na profilu.
   * Mapa { klíčOtázky: odpověď }. Prázdné = šablona nevyplněna (padá se na bio).
   */
  @Column({ type: 'jsonb', default: '{}' })
  storyAnswers: Record<string, string>;

  /** Obrázky příběhu: mapa { klíčOtázky: URL }. Zobrazí se pod daným odstavcem. */
  @Column({ type: 'jsonb', default: '{}' })
  storyImages: Record<string, string>;

  /** Režim příběhu: 'template' (šablona) | 'custom' (volný editor). NULL = šablona/bio. */
  @Column({ nullable: true })
  storyMode: string;

  /** HTML z volného editoru — UŽ sanitizované na serveru (sanitizeStoryHtml). */
  @Column({ nullable: true, type: 'text' })
  storyHtml: string;

  /** Opt-in: zobrazit profil ve veřejné výloze /vyrobci. Výchozí false (GDPR). */
  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ type: 'jsonb', default: '{}' })
  marketplaceLinks: Record<string, string>;

  @OneToMany(() => Product, (product) => product.maker)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
