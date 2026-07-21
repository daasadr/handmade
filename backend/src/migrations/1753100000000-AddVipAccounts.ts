import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * VIP účty — neomezené optimalizace zdarma.
 *
 * Sloupce přidala entita `User` v commitu 94aca93 bez migrace. Na produkci
 * (`NODE_ENV=production` → `synchronize: false`) se proto nevytvořily a každý
 * SELECT nad `users` padal na „column User.isVip does not exist" — což shodilo
 * i přihlášení.
 *
 * Záměrně přes raw SQL s `IF NOT EXISTS`: sloupce mohly být doplněny ručně
 * při hašení výpadku, a `addColumns()` by v tom případě selhalo.
 */
export class AddVipAccounts1753100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isVip" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vipUntil" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "vipUntil"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isVip"`);
  }
}
