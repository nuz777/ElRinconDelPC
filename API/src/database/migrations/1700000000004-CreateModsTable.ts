import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModsTable1700000000004 implements MigrationInterface {
  name = 'CreateModsTable1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mods" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "version" VARCHAR(50) NOT NULL,
        "download_url" TEXT NOT NULL,
        "file_size" VARCHAR(50) NULL,
        "thumbnail_url" TEXT NULL,
        "game_id" UUID NOT NULL,
        "author_id" UUID NOT NULL,
        "downloads_count" INTEGER NOT NULL DEFAULT 0,
        "is_approved" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_mods_game" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_mods_author" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_mods_game_slug"
      ON "mods" ("game_id", "slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mods_game_id"
      ON "mods" ("game_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mods_author_id"
      ON "mods" ("author_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mods_is_approved"
      ON "mods" ("is_approved");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mods_is_active"
      ON "mods" ("is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mods";`);
  }
}
