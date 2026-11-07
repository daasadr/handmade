import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Opt-in zveřejnění profilu ve veřejné výloze (`/vyrobci`). Výchozí false —
 * tvůrce se zobrazí veřejně, jen když to sám zapne (GDPR, souhlas).
 *
 * Raw SQL s IF NOT EXISTS — idempotentní.
 */
export class AddMakerPublicFlag1758000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "isPublic" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "isPublic"`,
    );
  }
}
