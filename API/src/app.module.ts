import {
  Logger,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AiCopilotModule } from './AiCopilot/ai-copilot.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './Auth/Infraestructure/auth.module.js';
import { CatalogModule } from './Catalog/catalog.module.js';
import { ShortenerModule } from './Common/shortener/shortener.module.js';
import { dataSourceOptions } from './database/data-source.js';
import { seedAdmins } from './database/seeds/admin.seed.js';
import { GamesModule } from './Games/games.module.js';
import { ResponseTransformInterceptor } from './Interceptors/response-transform.interceptor.js';
import { CorrelationIdMiddleware } from './Middlewares/correlation-id.middleware.js';
import { LoggerMiddleware } from './Middlewares/logger.middleware.js';
import { ModsModule } from './Mods/mods.module.js';
import { ToolsModule } from './Tools/tools.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minuto (60,000 ms)
        limit: 60, // 60 solicitudes por minuto por IP
      },
    ]),
    TypeOrmModule.forRoot(dataSourceOptions),
    ShortenerModule,
    AuthModule,
    AiCopilotModule,
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
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    // El esquema e índices se gestionan por migraciones TypeORM (migrationsRun).
    // El seed solo verifica si faltan admins (sin re-hashear los existentes) salvo RUN_STARTUP_SEED=false.
    if (process.env.RUN_STARTUP_SEED === 'false') {
      return;
    }

    try {
      await seedAdmins(this.dataSource);
    } catch (err) {
      this.logger.warn(
        `Seed admins warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
