/* oxlint-disable typescript/unbound-method */
import type { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { PostgresAuthRepository } from './auth.repository.js';
import { InMemoryAuthRepository } from './in-memory-auth.repository.js';

const buildUserRow = (override: Record<string, unknown> = {}) => ({
  id: 'u-1',
  email: 'nuz@sotano.com',
  password_hash: 'hashed',
  provider: 'local',
  first_name: 'Nuz',
  last_name: 'Dev',
  picture: null,
  role: Role.USER,
  reset_token: null,
  reset_token_expires: null,
  created_at: '2026-01-01T00:00:00Z',
  ...override,
});

describe('InMemoryAuthRepository & PostgresAuthRepository (Unit)', () => {
  describe('InMemoryAuthRepository', () => {
    let repo: InMemoryAuthRepository;

    beforeEach(() => {
      repo = new InMemoryAuthRepository();
    });

    it('crea, busca por email (case-insensitive) e id y actualiza campos', async () => {
      const created = await repo.create({
        email: '  Test@Sotano.com ',
        provider: 'local',
        passwordHash: 'hash1',
        name: 'Test User',
      });

      expect(created.email).toBe('test@sotano.com');
      await expect(repo.findByEmail('TEST@SOTANO.COM')).resolves.toBe(created);
      await expect(repo.findById(created.id)).resolves.toBe(created);

      const updated = await repo.update(created.id, {
        resetToken: '123456',
        resetTokenExpires: new Date('2026-12-01T00:00:00Z'),
      });
      expect(updated?.resetToken).toBe('123456');

      await expect(repo.update('inexistente', { name: 'X' })).resolves.toBeNull();
    });
  });

  describe('PostgresAuthRepository', () => {
    let inMemory: InMemoryAuthRepository;
    let dataSource: DataSource;
    let repo: PostgresAuthRepository;

    beforeEach(() => {
      inMemory = new InMemoryAuthRepository();
      dataSource = {
        isInitialized: true,
        query: vi.fn(),
      } as unknown as DataSource;
      repo = new PostgresAuthRepository(inMemory, dataSource);
    });

    it('hace fallback a InMemoryAuthRepository si dataSource no está inicializado', async () => {
      const uninitializedDs = { isInitialized: false } as unknown as DataSource;
      const fallbackRepo = new PostgresAuthRepository(inMemory, uninitializedDs);

      const user = await fallbackRepo.create({
        email: 'mem@sotano.com',
        provider: 'local',
      });
      await expect(fallbackRepo.findByEmail('mem@sotano.com')).resolves.toBe(user);
      await expect(fallbackRepo.findById(user.id)).resolves.toBe(user);
    });

    it('findByEmail busca por igualdad exacta en minúsculas para usar el índice UNIQUE', async () => {
      vi.mocked(dataSource.query).mockResolvedValue([buildUserRow()]);

      const user = await repo.findByEmail(' NUZ@sotano.com ');

      const [sql, params] = vi.mocked(dataSource.query).mock.calls[0];
      expect(sql).toContain('WHERE email = $1 LIMIT 1');
      expect(params).toEqual(['nuz@sotano.com']);
      expect(user?.name).toBe('Nuz Dev');
    });

    it('create divide first_name y last_name y normaliza email a minúsculas', async () => {
      vi.mocked(dataSource.query).mockResolvedValue([buildUserRow()]);

      await repo.create({
        email: '  NUZ@Sotano.COM ',
        provider: 'local',
        passwordHash: 'hash',
        name: 'Nuz Dev Senior',
      });

      const [, params] = vi.mocked(dataSource.query).mock.calls[0];
      expect(params).toEqual([
        'nuz@sotano.com',
        'hash',
        'local',
        'Nuz',
        'Dev Senior',
        null,
        Role.USER,
      ]);
    });

    it('update ejecuta una única consulta UPDATE RETURNING * sin SELECT previo', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([
        buildUserRow({ reset_token: '654321' }),
      ]);

      const updated = await repo.update('u-1', { resetToken: '654321' });

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(updated?.resetToken).toBe('654321');
    });

    it('update retorna null en 1 consulta si el usuario no existe', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([]);
      await expect(repo.update('missing', { name: 'X' })).resolves.toBeNull();
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });
});
