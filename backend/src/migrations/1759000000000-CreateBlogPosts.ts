import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Blog — články spravované adminem, veřejně čitelné. HTML se ukládá sanitizované
 * (viz BlogService). Idempotentní CREATE TABLE IF NOT EXISTS.
 */
export class CreateBlogPosts1759000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" varchar NOT NULL UNIQUE,
        "title" varchar NOT NULL,
        "excerpt" text,
        "contentHtml" text NOT NULL,
        "coverImageUrl" varchar,
        "authorName" varchar,
        "published" boolean NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_posts"`);
  }
}
