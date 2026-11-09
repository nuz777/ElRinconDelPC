import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega `public_code` (6 caracteres a-z0-9) a catalog_items para las URLs
 * compartibles del catálogo: /juego/{slug}-{codigo}, /mod-shader/..., /herramienta/...
 * Los ítems existentes reciben un código aleatorio.
 */
export class AddPublicCodeToCatalogItems1700000000008 implements MigrationInterface {
  name = 'AddPublicCodeToCatalogItems1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "public_code" VARCHAR(6) NULL;
    `);
    // Backfill: un código aleatorio por fila; se repite mientras haya colisiones.
    await queryRunner.query(`
      DO $$
      DECLARE
        r RECORD;
        candidate TEXT;
      BEGIN
        FOR r IN SELECT id FROM "catalog_items" WHERE "public_code" IS NULL LOOP
          LOOP
            SELECT string_agg(
              substr('abcdefghijklmnopqrstuvwxyz0123456789', (floor(random() * 36) + 1)::int, 1),
              ''
            ) INTO candidate
            FROM generate_series(1, 6);
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM "catalog_items" WHERE "public_code" = candidate
            );
          END LOOP;
          UPDATE "catalog_items" SET "public_code" = candidate WHERE id = r.id;
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_catalog_items_public_code"
      ON "catalog_items" ("public_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_catalog_items_public_code";`);
    await queryRunner.query(`ALTER TABLE "catalog_items" DROP COLUMN IF EXISTS "public_code";`);
  }
}
