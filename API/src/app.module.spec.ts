/* oxlint-disable typescript/unbound-method */
import type { MiddlewareConsumer } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from './app.module.js';
import { seedAdmins } from './database/seeds/admin.seed.js';
import { CorrelationIdMiddleware } from './Middlewares/correlation-id.middleware.js';
import { LoggerMiddleware } from './Middlewares/logger.middleware.js';

vi.mock('./database/seeds/admin.seed.js', () => ({
  seedAdmins: vi.fn().mockResolvedValue(undefined),
}));

describe('AppModule (Unit)', () => {
  const originalSeedEnv = process.env.RUN_STARTUP_SEED;
  let dataSource: DataSource;
  let appModule: AppModule;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RUN_STARTUP_SEED;
    dataSource = {
      query: vi.fn().mockResolvedValue([]),
    } as unknown as DataSource;
    appModule = new AppModule(dataSource);
  });

  afterEach(() => {
    if (originalSeedEnv === undefined) {
      delete process.env.RUN_STARTUP_SEED;
    } else {
      process.env.RUN_STARTUP_SEED = originalSeedEnv;
    }
  });

  it('onModuleInit no ejecuta DDL redundante (el esquema corre vía migraciones) y delega en seedAdmins', async () => {
    await appModule.onModuleInit();

    expect(dataSource.query).not.toHaveBeenCalled();
    expect(seedAdmins).toHaveBeenCalledWith(dataSource);
  });

  it('onModuleInit omite seedAdmins si RUN_STARTUP_SEED=false', async () => {
    process.env.RUN_STARTUP_SEED = 'false';

    await appModule.onModuleInit();

    expect(seedAdmins).not.toHaveBeenCalled();
  });

  it('configure registra CorrelationIdMiddleware y LoggerMiddleware para todas las rutas', () => {
    const forRoutes = vi.fn();
    const apply = vi.fn().mockReturnValue({ forRoutes });
    const consumer = { apply } as unknown as MiddlewareConsumer;

    appModule.configure(consumer);

    expect(apply).toHaveBeenCalledWith(CorrelationIdMiddleware, LoggerMiddleware);
    expect(forRoutes).toHaveBeenCalledWith('*');
  });
});
