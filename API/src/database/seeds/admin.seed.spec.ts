/* oxlint-disable typescript/unbound-method */
import * as bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedAdmins } from './admin.seed.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed_admin_pw'),
}));

describe('seedAdmins (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('omite bcrypt.hash y escrituras si los 3 administradores ya existen', async () => {
    const ds = {
      isInitialized: true,
      initialize: vi.fn(),
      destroy: vi.fn(),
      query: vi.fn().mockResolvedValueOnce([
        { email: 'theunrealultranigg@gmail.com' },
        { email: 'ivanlun647@gmail.com' },
        { email: 'nicholasandresdelarosarivera@hotmail.com' },
      ]),
    } as unknown as DataSource;

    await seedAdmins(ds);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(ds.query).toHaveBeenCalledTimes(1);
    expect(ds.destroy).not.toHaveBeenCalled();
  });

  it('crea únicamente los administradores faltantes', async () => {
    const ds = {
      isInitialized: true,
      initialize: vi.fn(),
      destroy: vi.fn(),
      query: vi
        .fn()
        .mockResolvedValueOnce([
          { email: 'theunrealultranigg@gmail.com' },
          { email: 'ivanlun647@gmail.com' },
        ])
        .mockResolvedValue([]),
    } as unknown as DataSource;

    await seedAdmins(ds);

    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    // 1 SELECT inicial + (1 DELETE + 1 INSERT) para el 1 faltante
    expect(ds.query).toHaveBeenCalledTimes(3);
  });
});
