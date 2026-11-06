import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGamesTable1700000000003 implements MigrationInterface {
  name = 'CreateGamesTable1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "games" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "price" NUMERIC(10, 2) NOT NULL DEFAULT 0,
        "discount_price" NUMERIC(10, 2) NULL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "genres" TEXT[] NOT NULL DEFAULT '{}',
        "cover_image" TEXT NOT NULL,
        "banner_image" TEXT NULL,
        "developer" VARCHAR(150) NOT NULL,
        "publisher" VARCHAR(150) NOT NULL,
        "release_date" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "min_os" VARCHAR(100) NULL,
        "min_storage" VARCHAR(100) NULL,
        "min_ram" VARCHAR(100) NULL,
        "min_cpu" VARCHAR(100) NULL,
        "min_gpu" VARCHAR(100) NULL,
        "minimum_requirements" JSONB NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_games_slug"
      ON "games" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_title"
      ON "games" ("title");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_is_active"
      ON "games" ("is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "games";`);
  }
}
