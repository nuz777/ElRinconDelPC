import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetPasswordColumnsToUsers1700000000001
  implements MigrationInterface
{
  name = 'AddResetPasswordColumnsToUsers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_token" VARCHAR(6) NULL,
      ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP WITH TIME ZONE NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "reset_token_expires",
      DROP COLUMN IF EXISTS "reset_token";
    `);
  }
}
