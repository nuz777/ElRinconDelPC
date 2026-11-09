import {
  Logger,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  type OnModuleInit,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './Auth/Infraestructure/auth.module.js';
import { CatalogModule } from './Catalog/catalog.module.js';
import { dataSourceOptions } from './database/data-source.js';
import { seedAdmins } from './database/seeds/admin.seed.js';
import { GamesModule } from './Games/games.module.js';
import { LoggingBenchmarkInterceptor } from './Interceptors/logging-benchmark.interceptor.js';
import { ResponseTransformInterceptor } from './Interceptors/response-transform.interceptor.js';
import { CorrelationIdMiddleware } from './Middlewares/correlation-id.middleware.js';
import { LoggerMiddleware } from './Middlewares/logger.middleware.js';
import { ModsModule } from './Mods/mods.module.js';
import { ToolsModule } from './Tools/tools.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minuto (60,000 ms)
        limit: 60, // 60 solicitudes por minuto por IP
      },
    ]),
    TypeOrmModule.forRoot(dataSourceOptions),
    AuthModule,
    CatalogModule,
    GamesModule,
    ModsModule,
    ToolsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingBenchmarkInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly dataSource: DataSource) {}

  private async runSafeQuery(sql: string): Promise<void> {
    try {
      await this.dataSource.query(sql);
    } catch (err) {
      this.logger.warn(
        `DDL warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleInit(): Promise<void> {
    await this.runSafeQuery(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await this.runSafeQuery(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Tabla users
    await this.runSafeQuery(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NULL,
        "provider" VARCHAR(50) NOT NULL DEFAULT 'local',
        "provider_id" VARCHAR(255) NULL,
        "first_name" VARCHAR(100) NULL,
        "last_name" VARCHAR(100) NULL,
        "picture" TEXT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "reset_token" VARCHAR(6) NULL,
        "reset_token_expires" TIMESTAMP WITH TIME ZONE NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await this.runSafeQuery(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" VARCHAR(6) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP WITH TIME ZONE NULL;`,
    );

    // Semilla automática de administradores (elimina cuentas corrientes previas con el mismo correo y deja solo el rol admin)
    try {
      await seedAdmins(this.dataSource);
    } catch (err) {
      this.logger.warn(
        `Seed admins warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // 2. Tabla catalog_items
    await this.runSafeQuery(`
      CREATE TABLE IF NOT EXISTS "catalog_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "section" VARCHAR(20) NOT NULL CHECK ("section" IN ('JUEGOS', 'MODS', 'HERRAMIENTAS')),
        "title" VARCHAR(150) NOT NULL,
        "genre" VARCHAR(100) NOT NULL,
        "size" VARCHAR(50) NULL,
        "version" VARCHAR(50) NULL DEFAULT 'v1.0',
        "badge" VARCHAR(50) NULL,
        "cover_url" TEXT NULL,
        "download_url" TEXT NULL,
        "developer" VARCHAR(150) NULL,
        "short_description" TEXT NOT NULL,
        "minimum_requirements" JSONB NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "minimum_requirements" JSONB NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "size" VARCHAR(50) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "version" VARCHAR(50) NULL DEFAULT 'v1.0';`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "badge" VARCHAR(50) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "cover_url" TEXT NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "download_url" TEXT NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "developer" VARCHAR(150) NULL;`,
    );

    // 3. Tabla games
    await this.runSafeQuery(`
      CREATE TABLE IF NOT EXISTS "games" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "price" NUMERIC(10, 2) NOT NULL DEFAULT 0,
        "discount_price" NUMERIC(10, 2) NULL,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "genres" TEXT[] NOT NULL DEFAULT '{}',
        "cover_image" TEXT NOT NULL,
        "banner_image" TEXT NULL,
        "developer" VARCHAR(150) NOT NULL,
        "publisher" VARCHAR(150) NOT NULL,
        "release_date" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "min_os" VARCHAR(255) NULL,
        "min_storage" VARCHAR(255) NULL,
        "min_ram" VARCHAR(255) NULL,
        "min_cpu" VARCHAR(255) NULL,
        "min_gpu" VARCHAR(255) NULL,
        "minimum_requirements" JSONB NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "price" SET DEFAULT 0;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "release_date" DROP NOT NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "min_os" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "min_storage" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "min_ram" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "min_cpu" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "min_gpu" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "minimum_requirements" JSONB NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "min_os" TYPE VARCHAR(255);`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "min_storage" TYPE VARCHAR(255);`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "min_ram" TYPE VARCHAR(255);`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "min_cpu" TYPE VARCHAR(255);`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "games" ALTER COLUMN "min_gpu" TYPE VARCHAR(255);`,
    );

    // 4. Tabla mods
    await this.runSafeQuery(`
      CREATE TABLE IF NOT EXISTS "mods" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "version" VARCHAR(50) NOT NULL,
        "download_url" TEXT NOT NULL,
        "file_size" VARCHAR(50) NULL,
        "thumbnail_url" TEXT NULL,
        "game_id" UUID NULL,
        "author_id" UUID NOT NULL,
        "downloads_count" INTEGER NOT NULL DEFAULT 0,
        "is_approved" BOOLEAN NOT NULL DEFAULT FALSE,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "min_os" VARCHAR(255) NULL,
        "min_storage" VARCHAR(255) NULL,
        "min_ram" VARCHAR(255) NULL,
        "min_cpu" VARCHAR(255) NULL,
        "min_gpu" VARCHAR(255) NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await this.runSafeQuery(
      `ALTER TABLE "mods" ALTER COLUMN "game_id" DROP NOT NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "mods" ADD COLUMN IF NOT EXISTS "min_os" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "mods" ADD COLUMN IF NOT EXISTS "min_storage" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "mods" ADD COLUMN IF NOT EXISTS "min_ram" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "mods" ADD COLUMN IF NOT EXISTS "min_cpu" VARCHAR(255) NULL;`,
    );
    await this.runSafeQuery(
      `ALTER TABLE "mods" ADD COLUMN IF NOT EXISTS "min_gpu" VARCHAR(255) NULL;`,
    );

    // 5. Tabla tools
    await this.runSafeQuery(`
      CREATE TABLE IF NOT EXISTS "tools" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(150) NOT NULL,
        "slug" VARCHAR(150) NOT NULL,
        "description" TEXT NOT NULL,
        "category" VARCHAR(100) NOT NULL DEFAULT 'Utilidades',
        "version" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
        "size" VARCHAR(50) NULL,
        "download_url" TEXT NOT NULL,
        "image_url" TEXT NULL,
        "tags" TEXT[] NOT NULL DEFAULT '{}',
        "author_id" UUID NOT NULL,
        "downloads_count" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.logger.log('Esquema PostgreSQL verificado y actualizado.');
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
