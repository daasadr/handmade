import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleAuth1752400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'users',
      'passwordHash',
      new TableColumn({ name: 'passwordHash', type: 'varchar', isNullable: true }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({ name: 'googleId', type: 'varchar', isNullable: true, isUnique: true }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'googleId');
    await queryRunner.changeColumn(
      'users',
      'passwordHash',
      new TableColumn({ name: 'passwordHash', type: 'varchar', isNullable: false }),
    );
  }
}
