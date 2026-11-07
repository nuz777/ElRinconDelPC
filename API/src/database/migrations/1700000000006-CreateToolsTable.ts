import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateToolsTable1700000000006 implements MigrationInterface {
  name = 'CreateToolsTable1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tools" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(150) NOT NULL,
        "slug" VARCHAR(150) NOT NULL,
        "description" TEXT NOT NULL,
        "category" VARCHAR(100) NOT NULL DEFAULT 'Utilidades',
        "version" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
        "size" VARCHAR(50) NULL,
        "download_url" TEXT NOT NULL,
        "image_url" TEXT NULL,
        "tags" TEXT[] NOT NULL DEFAULT '{}',
        "author_id" UUID NOT NULL,
        "downloads_count" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_tools_author" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_tools_slug"
      ON "tools" ("slug");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tools_category"
      ON "tools" ("category");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tools_author_id"
      ON "tools" ("author_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tools_is_active"
      ON "tools" ("is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tools";`);
  }
}
