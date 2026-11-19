import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Guarda el encuadre del banner de cabecera (posición X/Y en % y zoom) de cada ítem del catálogo. */
export class AddBannerFramingToCatalogItems1700000000014 implements MigrationInterface {
  name = 'AddBannerFramingToCatalogItems1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      ADD COLUMN IF NOT EXISTS "banner_framing" JSONB NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      DROP COLUMN IF EXISTS "banner_framing";
    `);
  }
}
