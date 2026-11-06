import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Obrázky v příběhu tvůrce. Mapa { klíčOtázky: URL }, takže obrázek je navázaný
 * na odstavec a na profilu se zobrazí pod ním — příběh je pak ilustrovaný.
 *
 * Raw SQL s IF NOT EXISTS — idempotentní.
 */
export class AddProfileStoryImages1756000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "storyImages" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "storyImages"`,
    );
  }
}
