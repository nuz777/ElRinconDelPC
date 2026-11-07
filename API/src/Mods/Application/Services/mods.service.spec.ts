/* oxlint-disable typescript/unbound-method */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Mod } from '../../Domain/Entities/mod.entity.js';
import type { ModRepository } from '../../Domain/interfaces/mod.repository.interface.js';
import { ModsService } from './mods.service.js';

const MOD_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const GAME_ID = '11111111-2222-3333-4444-555555555555';
const AUTHOR_ID = 'user-author-123';
const OTHER_USER_ID = 'user-other-456';

const buildMod = (override: Partial<Mod> = {}): Mod =>
  new Mod({
    id: MOD_ID,
    title: 'Sodium',
    slug: 'sodium',
    description: 'Mod de optimización gráfica.',
    version: 'v0.5.8',
    downloadUrl: 'https://modrinth.com/mod/sodium',
    gameId: GAME_ID,
    authorId: AUTHOR_ID,
    downloadsCount: 10,
    isApproved: true,
    isActive: true,
    ...override,
  });

describe('ModsService (Unit)', () => {
  let service: ModsService;
  let repository: ModRepository;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      gameExists: vi.fn(),
      findByGameId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      incrementDownloads: vi.fn(),
      approve: vi.fn(),
      getModDetails: vi.fn(),
    };
    service = new ModsService(repository);
  });

  describe('createMod', () => {
    it('debe lanzar NotFoundException si el juego no existe', async () => {
      vi.mocked(repository.gameExists).mockResolvedValue(false);

      await expect(
        service.createMod(AUTHOR_ID, {
          title: 'Sodium',
          description: 'Desc',
          version: 'v1.0',
          downloadUrl: 'https://ejemplo.com',
          gameId: GAME_ID,
          minimumRequirements: { os: '', storage: '', ram: '', cpu: '', gpu: '' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si ya existe un mod con ese slug para el juego', async () => {
      vi.mocked(repository.gameExists).mockResolvedValue(true);
      vi.mocked(repository.findBySlug).mockResolvedValue(buildMod());

      await expect(
        service.createMod(AUTHOR_ID, {
          title: 'Sodium',
          description: 'Desc',
          version: 'v1.0',
          downloadUrl: 'https://ejemplo.com',
          gameId: GAME_ID,
          minimumRequirements: { os: '', storage: '', ram: '', cpu: '', gpu: '' },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear el mod exitosamente', async () => {
      vi.mocked(repository.gameExists).mockResolvedValue(true);
      vi.mocked(repository.findBySlug).mockResolvedValue(null);
      const expected = buildMod();
      vi.mocked(repository.create).mockResolvedValue(expected);

      const result = await service.createMod(AUTHOR_ID, {
        title: 'Sodium',
        description: 'Mod de optimización gráfica.',
        version: 'v0.5.8',
        downloadUrl: 'https://modrinth.com/mod/sodium',
        gameId: GAME_ID,
        minimumRequirements: { os: 'Win 10', storage: '1 GB', ram: '4 GB', cpu: 'i3', gpu: 'Intel HD' },
      });

      expect(result).toBe(expected);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sodium',
          slug: 'sodium',
          gameId: GAME_ID,
          authorId: AUTHOR_ID,
        }),
      );
    });
  });

  describe('updateMod', () => {
    it('debe permitir la edición al autor original', async () => {
      const mod = buildMod();
      const updated = buildMod({ version: 'v0.6.0' });

      vi.mocked(repository.findById).mockResolvedValue(mod);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await service.updateMod(MOD_ID, AUTHOR_ID, 'user', {
        version: 'v0.6.0',
      });

      expect(result).toBe(updated);
    });

    it('debe permitir la edición a un administrador aunque no sea el autor', async () => {
      const mod = buildMod();
      const updated = buildMod({ version: 'v0.6.0' });

      vi.mocked(repository.findById).mockResolvedValue(mod);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await service.updateMod(MOD_ID, OTHER_USER_ID, 'admin', {
        version: 'v0.6.0',
      });

      expect(result).toBe(updated);
    });

    it('debe lanzar ForbiddenException si un usuario común intenta editar el mod de otro', async () => {
      const mod = buildMod();
      vi.mocked(repository.findById).mockResolvedValue(mod);

      await expect(
        service.updateMod(MOD_ID, OTHER_USER_ID, 'user', {
          version: 'v0.6.0',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteMod', () => {
    it('debe lanzar ForbiddenException si un usuario sin permisos intenta borrar el mod', async () => {
      const mod = buildMod();
      vi.mocked(repository.findById).mockResolvedValue(mod);

      await expect(
        service.deleteMod(MOD_ID, OTHER_USER_ID, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe eliminar lógicamente el mod si es el autor', async () => {
      const mod = buildMod();
      vi.mocked(repository.findById).mockResolvedValue(mod);
      vi.mocked(repository.delete).mockResolvedValue(true);

      const result = await service.deleteMod(MOD_ID, AUTHOR_ID, 'user');
      expect(result).toEqual({
        message: 'Mod eliminado correctamente (borrado lógico)',
        id: MOD_ID,
      });
    });
  });

  describe('approveMod', () => {
    it('debe aprobar el mod pendiente', async () => {
      const mod = buildMod({ isApproved: false });
      const approved = buildMod({ isApproved: true });

      vi.mocked(repository.findById)
        .mockResolvedValueOnce(mod)
        .mockResolvedValueOnce(approved);
      vi.mocked(repository.approve).mockResolvedValue(true);

      const result = await service.approveMod(MOD_ID);
      expect(result.isApproved).toBe(true);
      expect(repository.approve).toHaveBeenCalledWith(MOD_ID);
    });
  });
});
