import { afterEach, describe, expect, it, vi } from 'vitest';

describe('data-source (Unit)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('desactiva logging SQL por defecto, configura pool y limpia DATABASE_URL con comillas/prefijos', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = '  "DATABASE_URL=postgresql://user:pass@host:5432/db"  ';
    process.env.DB_SSL = 'false';
    delete process.env.DB_LOGGING;

    vi.resetModules();
    const mod = await import('./data-source.js');

    expect(mod.dataSourceOptions.logging).toBe(false);
    expect(mod.dataSourceOptions.synchronize).toBe(false);
    expect(mod.dataSourceOptions.migrationsRun).toBe(true);
    expect(mod.dataSourceOptions.extra).toMatchObject({
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    expect((mod.dataSourceOptions as { url?: string }).url).toBe(
      'postgresql://user:pass@host:5432/db',
    );
  });

  it('activa logging solo cuando DB_LOGGING=true y activa SSL por defecto en production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/db';
    process.env.DB_LOGGING = 'true';
    process.env.DB_RUN_MIGRATIONS = 'false';
    delete process.env.DB_SSL;

    vi.resetModules();
    const mod = await import('./data-source.js');

    expect(mod.dataSourceOptions.logging).toBe(true);
    expect(mod.dataSourceOptions.migrationsRun).toBe(false);
    expect((mod.dataSourceOptions as { ssl?: unknown }).ssl).toEqual({
      rejectUnauthorized: false,
    });
  });
});
