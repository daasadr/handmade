import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Custom režim profilu (volný bohatý editor) vedle šablony.
 *
 * - `storyMode`: 'template' (řízené otázky) | 'custom' (volný editor). NULL =
 *   staré chování (šablona/bio).
 * - `storyHtml`: HTML z editoru, UŽ sanitizované na serveru (viz
 *   makers.service `sanitizeStoryHtml`). Nikdy neukládat neočištěné.
 *
 * Raw SQL s IF NOT EXISTS — idempotentní.
 */
export class AddProfileCustomStory1757000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "storyMode" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "storyHtml" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "storyHtml"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "storyMode"`,
    );
  }
}
