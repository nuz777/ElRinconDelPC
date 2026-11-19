import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Crea la tabla admin_ai_configs vinculada 1:1 con users para guardar API Keys cifradas (AES-256-GCM) por administrador. */
export class CreateAdminAiConfigsTable1700000000015 implements MigrationInterface {
  name = 'CreateAdminAiConfigsTable1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_ai_configs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "provider" VARCHAR(20) NOT NULL DEFAULT 'gemini'
          CHECK ("provider" IN ('gemini', 'claude', 'nvidia')),
        "encrypted_api_key" TEXT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_ai_configs";`);
  }
}
