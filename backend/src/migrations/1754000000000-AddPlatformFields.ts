import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Pole specifická pro konkrétní marketplace.
 *
 * Každá platforma vyplňuje jiná pole: Etsy má tagy (max 20 znaků) + materiály,
 * Amazon má bullet points + search terms, Fler české tagy/materiály. Sdílená
 * pole (název, popis, cena, tagy) zůstávají ve vlastních sloupcích; tyhle extra
 * per-platform věci ukládáme do jednoho JSONB `platformFields`:
 *   { materials?: string[], bulletPoints?: string[], searchTerms?: string }
 *
 * Raw SQL s IF NOT EXISTS — idempotentní.
 */
export class AddPlatformFields1754000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" ADD COLUMN IF NOT EXISTS "platformFields" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_optimizations" DROP COLUMN IF EXISTS "platformFields"`,
    );
  }
}
