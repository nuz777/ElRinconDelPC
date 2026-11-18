import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1700000000000 implements MigrationInterface {
  name = 'CreateUsersTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NULL,
        "provider" VARCHAR(50) NOT NULL DEFAULT 'local',
        "provider_id" VARCHAR(255) NULL,
        "first_name" VARCHAR(100) NULL,
        "last_name" VARCHAR(100) NULL,
        "picture" TEXT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
  }
}
