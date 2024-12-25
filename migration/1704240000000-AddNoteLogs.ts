import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddNoteLogs1704240000000 implements MigrationInterface {
  name = 'AddNoteLogs1704240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "noteLogs" integer[] NOT NULL DEFAULT '{}'::integer[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "noteLogs"');
  }
}
