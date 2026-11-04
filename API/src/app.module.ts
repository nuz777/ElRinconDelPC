import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './Auth/Infraestructure/auth.module.js';
import { CatalogModule } from './Catalog/catalog.module.js';
import { dataSourceOptions } from './database/data-source.js';
import { GamesModule } from './Games/games.module.js';
import { LoggingBenchmarkInterceptor } from './Interceptors/logging-benchmark.interceptor.js';
import { ResponseTransformInterceptor } from './Interceptors/response-transform.interceptor.js';
import { CorrelationIdMiddleware } from './Middlewares/correlation-id.middleware.js';
import { LoggerMiddleware } from './Middlewares/logger.middleware.js';
import { ModsModule } from './Mods/mods.module.js';
import { ToolsModule } from './Tools/tools.module.js';

@Module({
  imports: [
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
      provide: APP_INTERCEPTOR,
      useClass: LoggingBenchmarkInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
