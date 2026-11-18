import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Apartado ROMs: permite la sección 'ROMS' en catalog_items y agrega
 * marca, consola y emulador recomendado (solo se usan en ROMs).
 */
export class AddRomsSectionToCatalogItems1700000000009 implements MigrationInterface {
  name = 'AddRomsSectionToCatalogItems1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items" DROP CONSTRAINT IF EXISTS "catalog_items_section_check";
    `);
    await queryRunner.query(`
      UPDATE "catalog_items"
      SET "section" = CASE
        WHEN UPPER(TRIM("section")) IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS', 'ADULTOS') THEN UPPER(TRIM("section"))
        WHEN UPPER(TRIM("section")) LIKE 'ROM%' THEN 'ROMS'
        WHEN UPPER(TRIM("section")) LIKE 'MOD%' THEN 'MODS'
        WHEN UPPER(TRIM("section")) LIKE 'HERRAMIENTA%' OR UPPER(TRIM("section")) LIKE 'TOOL%' THEN 'HERRAMIENTAS'
        WHEN UPPER(TRIM("section")) LIKE 'ADULT%' OR UPPER(TRIM("section")) LIKE '%18%' THEN 'ADULTOS'
        ELSE 'JUEGOS'
      END
      WHERE "section" NOT IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS', 'ADULTOS');
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_section_check"
      CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS', 'ADULTOS'));
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
        ADD COLUMN IF NOT EXISTS "brand" VARCHAR(50) NULL,
        ADD COLUMN IF NOT EXISTS "console" VARCHAR(80) NULL,
        ADD COLUMN IF NOT EXISTS "emulator" VARCHAR(150) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "catalog_items" WHERE "section" = 'ROMS';`);
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
        DROP COLUMN IF EXISTS "emulator",
        DROP COLUMN IF EXISTS "console",
        DROP COLUMN IF EXISTS "brand";
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" DROP CONSTRAINT IF EXISTS "catalog_items_section_check";
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_section_check"
      CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS'));
    `);
  }
}
