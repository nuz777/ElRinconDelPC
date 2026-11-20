import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserFavoriteCatalogItems1700000000017 implements MigrationInterface {
  name = 'CreateUserFavoriteCatalogItems1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_favorite_catalog_items" (
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "catalog_item_id" UUID NOT NULL REFERENCES "catalog_items"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("user_id", "catalog_item_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_favorites_user_created_at"
      ON "user_favorite_catalog_items" ("user_id", "created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_favorites_user_created_at";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_favorite_catalog_items";`);
  }
}
