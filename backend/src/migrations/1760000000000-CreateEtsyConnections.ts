import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabulka propojení Etsy obchodu tvůrce (OAuth). Drží jen ŠIFROVANÝ refresh token
 * (viz EtsyConnection entita / TokenCipher). Access token se neukládá.
 *
 * Raw SQL s IF NOT EXISTS — idempotentní. Timestamp vyšší než poslední migrace
 * (1759000000000-CreateBlogPosts).
 */
export class CreateEtsyConnections1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "etsy_connections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "etsyUserId" character varying NOT NULL,
        "shopId" character varying NOT NULL,
        "refreshTokenEnc" text NOT NULL,
        "scopes" character varying,
        "connectedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_etsy_connections" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_etsy_connections_userId" UNIQUE ("userId")
      )
    `);
    // FK na users s ON DELETE CASCADE — smazání uživatele smaže i propojení.
    // Přidáváme zvlášť s IF NOT EXISTS přes DO blok (ADD CONSTRAINT IF NOT EXISTS
    // Postgres nepodporuje přímo).
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_etsy_connections_user'
        ) THEN
          ALTER TABLE "etsy_connections"
            ADD CONSTRAINT "FK_etsy_connections_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "etsy_connections"`);
  }
}
