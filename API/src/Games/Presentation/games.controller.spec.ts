/* oxlint-disable typescript/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModsService } from '../../Mods/Application/Services/mods.service.js';
import type { GamesService } from '../Application/Services/games.service.js';
import { Game } from '../Domain/Entities/game.entity.js';
import { GamesController } from './games.controller.js';

const GAME_ID = '11111111-2222-3333-4444-555555555555';

const buildGame = (): Game =>
  new Game({
    id: GAME_ID,
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    description: 'Metroidvania',
    price: 0,
    stock: 10,
    genres: ['Indie'],
    coverImage: 'cover.jpg',
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
  });

describe('GamesController (Unit)', () => {
  let controller: GamesController;
  let gamesService: GamesService;
  let modsService: ModsService;

  beforeEach(() => {
    gamesService = {
      getGames: vi.fn(),
      getGameById: vi.fn(),
      getGameBySlug: vi.fn(),
      createGame: vi.fn(),
      updateGame: vi.fn(),
      deleteGame: vi.fn(),
    } as unknown as GamesService;

    modsService = {
      getModsByGame: vi.fn(),
    } as unknown as ModsService;

    controller = new GamesController(gamesService, modsService);
  });

  it('findAll delega en gamesService.getGames', async () => {
    const paginated = { items: [buildGame()], total: 1, page: 1, limit: 10, totalPages: 1 };
    vi.mocked(gamesService.getGames).mockResolvedValue(paginated);

    await expect(controller.findAll({ page: 1, limit: 10 })).resolves.toBe(paginated);
  });

  it('findOne distingue UUID de slug y hace una sola llamada al servicio', async () => {
    const game = buildGame();
    vi.mocked(gamesService.getGameById).mockResolvedValue(game);
    vi.mocked(gamesService.getGameBySlug).mockResolvedValue(game);

    await expect(controller.findOne('hollow-knight')).resolves.toBe(game);
    expect(gamesService.getGameById).not.toHaveBeenCalled();
    expect(gamesService.getGameBySlug).toHaveBeenCalledWith('hollow-knight');

    await expect(controller.findOne(GAME_ID)).resolves.toBe(game);
    expect(gamesService.getGameById).toHaveBeenCalledWith(GAME_ID);
  });

  it('findOne propaga NotFoundException si no existe el slug', async () => {
    vi.mocked(gamesService.getGameBySlug).mockRejectedValue(new NotFoundException());

    await expect(controller.findOne('inexistente')).rejects.toThrow(NotFoundException);
  });

  it('create, replace, update, remove y getGamesMods delegan correctamente', async () => {
    const game = buildGame();
    vi.mocked(gamesService.createGame).mockResolvedValue(game);
    vi.mocked(gamesService.updateGame).mockResolvedValue(game);
    vi.mocked(gamesService.deleteGame).mockResolvedValue({ message: 'ok', id: GAME_ID });
    vi.mocked(modsService.getModsByGame).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    await expect(
      controller.create({
        title: 'Hollow Knight',
        description: 'Desc',
        stock: 10,
        coverImage: 'cover.jpg',
        developer: 'Team Cherry',
        publisher: 'Team Cherry',
        minimumRequirements: { os: '', storage: '', ram: '', cpu: '', gpu: '' },
      }),
    ).resolves.toBe(game);
    await expect(controller.replace(GAME_ID, { title: 'A' })).resolves.toBe(game);
    await expect(controller.update(GAME_ID, { title: 'B' })).resolves.toBe(game);
    await expect(controller.remove(GAME_ID)).resolves.toEqual({ message: 'ok', id: GAME_ID });
    await expect(controller.getGamesMods(GAME_ID, { page: 1, limit: 10 })).resolves.toMatchObject({
      total: 0,
    });
  });
});
