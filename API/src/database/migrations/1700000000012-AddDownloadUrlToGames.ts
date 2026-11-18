import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDownloadUrlToGames1700000000012 implements MigrationInterface {
  name = 'AddDownloadUrlToGames1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "games"
      ADD COLUMN IF NOT EXISTS "download_url" TEXT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "games"
      DROP COLUMN IF EXISTS "download_url";
    `);
  }
}
