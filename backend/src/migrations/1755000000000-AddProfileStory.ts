import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Profil jako příběh tvůrce — první dávka (šablona + motto).
 *
 * - `motto`: oblíbený citát / hláška pod jménem tvůrce (text, volitelné).
 * - `storyAnswers`: odpovědi na řízené otázky šablony, ze kterých se na veřejném
 *   profilu složí souvislý příběh. JSONB mapa { [klíčOtázky]: odpověď }.
 *   Prázdné `{}` = uživatel šablonu nevyplnil → padá se na starý `bio`.
 *
 * Raw SQL s IF NOT EXISTS — idempotentní. (Custom bohatý editor přijde zvlášť
 * jako další sloupec, až na něj dojde.)
 */
export class AddProfileStory1755000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "motto" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" ADD COLUMN IF NOT EXISTS "storyAnswers" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "storyAnswers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maker_profiles" DROP COLUMN IF EXISTS "motto"`,
    );
  }
}
