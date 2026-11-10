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
      ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_section_check"
      CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS'));
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
