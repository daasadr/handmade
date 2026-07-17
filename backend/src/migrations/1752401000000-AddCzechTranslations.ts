import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCzechTranslations1752401000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('ai_optimizations', [
      new TableColumn({ name: 'titleCzech', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'descriptionCzech', type: 'text', isNullable: true }),
      new TableColumn({ name: 'pricingRecommendationCzech', type: 'text', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('ai_optimizations', [
      'titleCzech', 'descriptionCzech', 'pricingRecommendationCzech',
    ]);
  }
}
