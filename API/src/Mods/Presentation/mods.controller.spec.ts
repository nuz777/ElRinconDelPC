/* oxlint-disable typescript/unbound-method */
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../../Auth/Infraestructure/security/jwt.strategy.js';
import type { ModsService } from '../Application/Services/mods.service.js';
import { Mod } from '../Domain/Entities/mod.entity.js';
import { ModsController } from './mods.controller.js';

const MOD_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_ID = 'user-1';

const buildMod = (): Mod =>
  new Mod({
    id: MOD_ID,
    title: 'Sodium',
    slug: 'sodium',
    description: 'Optimizador',
    version: 'v0.5.8',
    downloadUrl: 'https://modrinth.com/mod/sodium',
    authorId: USER_ID,
  });

describe('ModsController (Unit)', () => {
  let controller: ModsController;
  let modsService: ModsService;

  beforeEach(() => {
    modsService = {
      getModById: vi.fn(),
      incrementDownloadCount: vi.fn(),
      downloadMod: vi.fn(),
      createMod: vi.fn(),
      updateMod: vi.fn(),
      deleteMod: vi.fn(),
      approveMod: vi.fn(),
    } as unknown as ModsService;

    controller = new ModsController(modsService);
  });

  it('downloadMod delega en modsService.downloadMod en una sola llamada', async () => {
    vi.mocked(modsService.downloadMod).mockResolvedValue({
      downloadUrl: 'https://modrinth.com/mod/sodium',
    });

    const result = await controller.downloadMod(MOD_ID);

    expect(modsService.downloadMod).toHaveBeenCalledWith(MOD_ID);
    expect(modsService.getModById).not.toHaveBeenCalled();
    expect(result).toEqual({ downloadUrl: 'https://modrinth.com/mod/sodium' });
  });

  it('getModById, createMod, updateMod, deleteMod y approveMod delegan correctamente', async () => {
    const mod = buildMod();
    const req = {
      user: { id: USER_ID, userId: USER_ID, email: 'a@b.com', role: 'user' },
    } as unknown as Request & { user: AuthenticatedUser };

    vi.mocked(modsService.getModById).mockResolvedValue({ mod, game: null, author: null });
    vi.mocked(modsService.createMod).mockResolvedValue(mod);
    vi.mocked(modsService.updateMod).mockResolvedValue(mod);
    vi.mocked(modsService.deleteMod).mockResolvedValue({ message: 'ok', id: MOD_ID });
    vi.mocked(modsService.approveMod).mockResolvedValue(mod);

    await expect(controller.getModById(MOD_ID)).resolves.toMatchObject({ mod });
    await expect(
      controller.createMod(
        {
          title: 'Sodium',
          description: 'Optimizador',
          version: 'v0.5.8',
          downloadUrl: 'https://modrinth.com/mod/sodium',
          gameId: 'g-1',
          minimumRequirements: { os: '', storage: '', ram: '', cpu: '', gpu: '' },
        },
        req,
      ),
    ).resolves.toBe(mod);
    await expect(controller.updateMod(MOD_ID, { version: 'v0.6' }, req)).resolves.toBe(mod);
    await expect(controller.deleteMod(MOD_ID, req)).resolves.toEqual({
      message: 'ok',
      id: MOD_ID,
    });
    await expect(controller.approveMod(MOD_ID)).resolves.toBe(mod);
  });
});
