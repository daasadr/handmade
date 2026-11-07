import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** URL slug (unikátní) — z názvu, pro /blog/<slug>. */
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  /** HTML článku — UŽ sanitizované na serveru (viz BlogService). */
  @Column({ type: 'text' })
  contentHtml: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  authorName: string;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
