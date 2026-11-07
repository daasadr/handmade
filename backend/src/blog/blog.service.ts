import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { BlogPost } from './blog-post.entity';
import { sanitizeStoryHtml } from '../makers/makers.service';

export class CreateBlogPostDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsString()
  @MaxLength(100000)
  contentHtml: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateBlogPostDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(300) excerpt?: string;
  @IsOptional() @IsString() @MaxLength(100000) contentHtml?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() @MaxLength(100) authorName?: string;
  @IsOptional() @IsString() @MaxLength(200) slug?: string;
  @IsOptional() @IsBoolean() published?: boolean;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private repo: Repository<BlogPost>,
  ) {}

  // --- admin ---
  listAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getOne(id: string) {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Článek nenalezen');
    return post;
  }

  async create(dto: CreateBlogPostDto) {
    const post = this.repo.create({
      slug: await this.uniqueSlug(dto.slug || dto.title),
      title: dto.title,
      excerpt: dto.excerpt,
      contentHtml: sanitizeStoryHtml(dto.contentHtml || ''),
      coverImageUrl: dto.coverImageUrl,
      authorName: dto.authorName,
      published: !!dto.published,
      publishedAt: dto.published ? new Date() : undefined,
    });
    return this.repo.save(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.getOne(id);
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.slug !== undefined) post.slug = await this.uniqueSlug(dto.slug, id);
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
    if (dto.contentHtml !== undefined) post.contentHtml = sanitizeStoryHtml(dto.contentHtml);
    if (dto.coverImageUrl !== undefined) post.coverImageUrl = dto.coverImageUrl;
    if (dto.authorName !== undefined) post.authorName = dto.authorName;
    if (dto.published !== undefined) {
      // První publikace nastaví datum; odpublikování datum nemaže (historie).
      if (dto.published && !post.published) post.publishedAt = new Date();
      post.published = dto.published;
    }
    return this.repo.save(post);
  }

  async remove(id: string) {
    const post = await this.getOne(id);
    await this.repo.remove(post);
    return { message: 'Článek byl smazán' };
  }

  // --- public (jen publikované) ---
  async listPublished() {
    const posts = await this.repo.find({
      where: { published: true },
      order: { publishedAt: 'DESC' },
    });
    return posts.map((p) => this.card(p));
  }

  async getPublishedBySlug(slug: string) {
    const post = await this.repo.findOne({ where: { slug, published: true } });
    if (!post) throw new NotFoundException('Článek nenalezen');
    return post;
  }

  /** Karta do výpisu — bez celého HTML (menší payload). */
  private card(p: BlogPost) {
    return {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      coverImageUrl: p.coverImageUrl ?? null,
      authorName: p.authorName ?? null,
      publishedAt: p.publishedAt,
    };
  }

  private slugify(s: string): string {
    const base = (s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 80);
    return base || 'clanek';
  }

  /** Vrátí slug, který je volný (nebo patří tomuto článku). */
  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const root = this.slugify(base);
    let slug = root;
    let i = 1;
    // Teoreticky nekonečné, prakticky pár iterací; limit pro jistotu.
    while (i < 1000) {
      const existing = await this.repo.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${root}-${++i}`;
    }
    return `${root}-${Date.now()}`;
  }
}
