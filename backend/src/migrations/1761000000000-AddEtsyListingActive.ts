import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Příznak „Etsy listing je zveřejněný" (ne jen koncept). Výchozí false — push
 * zakládá koncept, který není veřejně koupitelný; výloha „Koupit na Etsy" ukáže
 * jen u zveřejněných (viz Product.etsyListingActive / syncListingState).
 *
 * Raw SQL s IF NOT EXISTS — idempotentní. Timestamp vyšší než 1760.
 */
export class AddEtsyListingActive1761000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "etsyListingActive" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "etsyListingActive"`,
    );
  }
}
