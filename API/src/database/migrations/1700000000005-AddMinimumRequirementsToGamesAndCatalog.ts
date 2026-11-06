import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMinimumRequirementsToGamesAndCatalog1700000000005
  implements MigrationInterface
{
  name = 'AddMinimumRequirementsToGamesAndCatalog1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      ADD COLUMN IF NOT EXISTS "minimum_requirements" JSONB NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "games"
      ALTER COLUMN "price" SET DEFAULT 0,
      ALTER COLUMN "release_date" DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS "min_os" VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS "min_storage" VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS "min_ram" VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS "min_cpu" VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS "min_gpu" VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS "minimum_requirements" JSONB NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "catalog_items"
      DROP COLUMN IF EXISTS "minimum_requirements";
    `);

    await queryRunner.query(`
      ALTER TABLE "games"
      DROP COLUMN IF EXISTS "min_os",
      DROP COLUMN IF EXISTS "min_storage",
      DROP COLUMN IF EXISTS "min_ram",
      DROP COLUMN IF EXISTS "min_cpu",
      DROP COLUMN IF EXISTS "min_gpu",
      DROP COLUMN IF EXISTS "minimum_requirements";
    `);
  }
}
