import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sincroniza columnas añadidas anteriormente desde AppModule.onModuleInit
 * y crea los índices faltantes y compuestos para optimizar consultas de listado,
 * autenticación, juegos, mods y herramientas.
 */
export class SyncSchemaAndAddPerformanceIndexes1700000000011
  implements MigrationInterface
{
  name = 'SyncSchemaAndAddPerformanceIndexes1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Paridad de columnas que solo estaban en AppModule.onModuleInit
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      ADD COLUMN IF NOT EXISTS "banner_url" TEXT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "games"
      ALTER COLUMN "min_os" TYPE VARCHAR(255),
      ALTER COLUMN "min_storage" TYPE VARCHAR(255),
      ALTER COLUMN "min_ram" TYPE VARCHAR(255),
      ALTER COLUMN "min_cpu" TYPE VARCHAR(255),
      ALTER COLUMN "min_gpu" TYPE VARCHAR(255);
    `);
    await queryRunner.query(`
      ALTER TABLE "mods"
      ADD COLUMN IF NOT EXISTS "min_os" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "min_storage" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "min_ram" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "min_cpu" VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS "min_gpu" VARCHAR(255) NULL;
    `);

    // 2. Normalizar correos existentes para poder buscar por igualdad exacta (usa índice UNIQUE)
    await queryRunner.query(`
      UPDATE "users"
      SET "email" = LOWER(TRIM("email"))
      WHERE "email" <> LOWER(TRIM("email"))
        AND NOT EXISTS (
          SELECT 1
          FROM "users" u2
          WHERE LOWER(TRIM(u2."email")) = LOWER(TRIM("users"."email"))
            AND u2."id" <> "users"."id"
        );
    `);

    // 3. Extensión pg_trgm para búsquedas ILIKE '%...%' aceleradas con GIN
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

    // 4. Índices de catalog_items
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_created_at"
      ON "catalog_items" ("created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_section_created_at"
      ON "catalog_items" ("section", "created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_title_trgm"
      ON "catalog_items" USING GIN ("title" gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_catalog_items_developer_trgm"
      ON "catalog_items" USING GIN ("developer" gin_trgm_ops);
    `);

    // 5. Índices de games
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_games_slug" ON "games" ("slug");
      EXCEPTION
        WHEN unique_violation OR duplicate_table THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_is_active_created_at"
      ON "games" ("is_active", "created_at" DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_games_genres_gin"
      ON "games" USING GIN ("genres");
    `);

    // 6. Índices de mods
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mods_game_active_approved_created"
      ON "mods" ("game_id", "is_active", "is_approved", "created_at" DESC);
    `);

    // 7. Índices de tools
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_tools_slug" ON "tools" ("slug");
      EXCEPTION
        WHEN unique_violation OR duplicate_table THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tools_active_category_created"
      ON "tools" ("is_active", "category", "created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tools_active_category_created";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_mods_game_active_approved_created";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_games_genres_gin";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_games_is_active_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_catalog_items_developer_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_catalog_items_title_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_catalog_items_section_created_at";`);
  }
}
