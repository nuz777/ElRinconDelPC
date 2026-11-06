import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogItemsTable1700000000002 implements MigrationInterface {
  name = 'CreateCatalogItemsTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalog_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "section" VARCHAR(20) NOT NULL
          CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS')),
        "title" VARCHAR(150) NOT NULL,
        "genre" VARCHAR(100) NOT NULL,
        "size" VARCHAR(50) NULL,
        "version" VARCHAR(50) NULL DEFAULT 'v1.0',
        "badge" VARCHAR(50) NULL,
        "cover_url" TEXT NULL,
        "download_url" TEXT NULL,
        "developer" VARCHAR(150) NULL,
        "short_description" TEXT NOT NULL,
        "minimum_requirements" JSONB NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_section_genre"
      ON "catalog_items" ("section", "genre");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_created_at"
      ON "catalog_items" ("created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalog_items";`);
  }
}
