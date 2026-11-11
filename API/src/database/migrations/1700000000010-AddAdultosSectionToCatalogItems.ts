import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Apartado +18 / Adultos: permite la sección 'ADULTOS' en catalog_items.
 */
export class AddAdultosSectionToCatalogItems1700000000010 implements MigrationInterface {
  name = 'AddAdultosSectionToCatalogItems1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items" DROP CONSTRAINT IF EXISTS "catalog_items_section_check";
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_section_check"
      CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS', 'ADULTOS'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "catalog_items" WHERE "section" = 'ADULTOS';`);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" DROP CONSTRAINT IF EXISTS "catalog_items_section_check";
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_section_check"
      CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS', 'ROMS'));
    `);
  }
}
