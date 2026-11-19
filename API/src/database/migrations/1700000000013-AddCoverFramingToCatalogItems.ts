import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Guarda el encuadre de la portada (posición X/Y en % y zoom) de cada ítem del catálogo. */
export class AddCoverFramingToCatalogItems1700000000013 implements MigrationInterface {
  name = 'AddCoverFramingToCatalogItems1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      ADD COLUMN IF NOT EXISTS "cover_framing" JSONB NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      DROP COLUMN IF EXISTS "cover_framing";
    `);
  }
}
