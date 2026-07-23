import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data o konkurenci z Etsy API + skóre počítané z reálného trhu.
 *
 * Sloupce na `ai_optimizations`: snímek konkurence (počet, cenové rozpětí,
 * nejčastější tagy) a `scoreSource`, který rozliší, jestli `competitivenessScore`
 * vychází z reálných dat ('market') nebo je to odhad AI ('ai').
 *
 * Raw SQL s IF NOT EXISTS — idempotentní.
 */
export class AddCompetitionData1753200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "competitorCount" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "priceMin" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "priceMedian" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "priceMax" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "priceCurrency" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "competitorTags" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "scoreSource" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'scoreSource',
      'competitorTags',
      'priceCurrency',
      'priceMax',
      'priceMedian',
      'priceMin',
      'competitorCount',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "ai_optimizations" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }
}
