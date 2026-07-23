import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Compliance s Etsy API Terms: surová data konkurence (ceny, tagy, počty)
 * NEUKLÁDÁME — Terms zakazují skladovat obsah Etsy déle než na dobu nutnou
 * k poskytnutí služby a zobrazovat produktová data starší než 6 h.
 *
 * Uživateli je proto ukážeme jen jednou (v odpovědi na analýzu, přechodně),
 * a natrvalo uložíme pouze `marketConclusion` — náš vlastní textový závěr,
 * který z dat vyvodíme. `competitivenessScore` (odvozené číslo) a `scoreSource`
 * zůstávají.
 *
 * Ruší sloupce přidané migrací 1753200000000. IF EXISTS → idempotentní i když
 * ta migrace ještě nedoběhla.
 */
export class SlimCompetitionStorage1753300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'competitorCount',
      'priceMin',
      'priceMedian',
      'priceMax',
      'priceCurrency',
      'competitorTags',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "ai_optimizations" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "marketConclusion" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" DROP COLUMN IF EXISTS "marketConclusion"`,
    );
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
  }
}
