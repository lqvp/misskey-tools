import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddAdminSettings1704067200000 implements MigrationInterface {
  name = 'AddAdminSettings1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_settings" (
        "id" SERIAL NOT NULL,
        "allowNewUsers" boolean NOT NULL DEFAULT true,
        "maxNewUsersPerDay" integer NOT NULL DEFAULT 0,
        "currentDate" TIMESTAMP,
        "todayUserCount" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_admin_settings" PRIMARY KEY ("id")
      )
    `);

    // Insert default settings
    await queryRunner.query(`
      INSERT INTO "admin_settings" ("allowNewUsers", "maxNewUsersPerDay", "todayUserCount")
      VALUES (true, 0, 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "admin_settings"');
  }
}
