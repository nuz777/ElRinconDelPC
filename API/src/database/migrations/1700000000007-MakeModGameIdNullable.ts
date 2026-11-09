import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeModGameIdNullable1700000000007 implements MigrationInterface {
  name = 'MakeModGameIdNullable1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "mods" ALTER COLUMN "game_id" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "mods" WHERE "game_id" IS NULL;
      ALTER TABLE "mods" ALTER COLUMN "game_id" SET NOT NULL;
    `);
  }
}
