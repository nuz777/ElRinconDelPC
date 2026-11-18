/* oxlint-disable typescript/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../../Domain/Entities/game.entity.js';
import type { GameRepository } from '../../Domain/interfaces/game.repository.interface.js';
import type { ExeIoService } from '../../../Common/shortener/exe-io.service.js';
import { GamesService } from './games.service.js';

const ID = '11111111-2222-3333-4444-555555555555';

const buildGame = (override: Partial<Game> = {}): Game =>
  new Game({
    id: ID,
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    description: 'Metroidvania de acción en Hallownest.',
    price: 15,
    stock: 100,
    genres: ['Metroidvania', 'Indie'],
    coverImage: 'https://ejemplo.com/cover.jpg',
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    ...override,
  });

describe('GamesService (Unit)', () => {
  let service: GamesService;
  let repository: GameRepository;
  let exeIoService: ExeIoService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    exeIoService = {
      shortenUrl: vi.fn(async (url: string) => `https://exe.io/short-${url.length}`),
    } as unknown as ExeIoService;
    service = new GamesService(repository, undefined, exeIoService);
  });

  describe('createGame', () => {
    it('debe crear un juego correctamente generando el slug a partir del título', async () => {
      vi.mocked(repository.findBySlug).mockResolvedValue(null);
      const expected = buildGame();
      vi.mocked(repository.create).mockResolvedValue(expected);

      const result = await service.createGame({
        title: ' Hollow Knight ',
        description: 'Metroidvania de acción en Hallownest.',
        price: 15,
        stock: 100,
        genres: ['Metroidvania', 'Indie'],
        coverImage: 'https://ejemplo.com/cover.jpg',
        developer: 'Team Cherry',
        publisher: 'Team Cherry',
        minimumRequirements: {
          os: 'Windows 10',
          storage: '9 GB',
          ram: '8 GB',
          cpu: 'Intel i5',
          gpu: 'GTX 1060',
        },
      });

      expect(result).toBe(expected);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hollow Knight',
          slug: 'hollow-knight',
          price: 15,
        }),
      );
    });

    it('acorta automáticamente downloadUrl con ExeIoService al crear un juego', async () => {
      vi.mocked(repository.findBySlug).mockResolvedValue(null);
      vi.mocked(exeIoService.shortenUrl).mockResolvedValueOnce(
        'https://exe.io/hk123',
      );
      const expected = buildGame({ downloadUrl: 'https://exe.io/hk123' });
      vi.mocked(repository.create).mockResolvedValue(expected);

      await service.createGame({
        title: 'Hollow Knight',
        description: 'Metroidvania',
        price: 15,
        stock: 100,
        coverImage: 'https://ejemplo.com/cover.jpg',
        downloadUrl: 'https://gofile.io/d/hollowknight',
        developer: 'Team Cherry',
        publisher: 'Team Cherry',
        minimumRequirements: {
          os: 'Windows 10',
          storage: '9 GB',
          ram: '8 GB',
          cpu: 'Intel i5',
          gpu: 'GTX 1060',
        },
      });

      expect(exeIoService.shortenUrl).toHaveBeenCalledWith(
        'https://gofile.io/d/hollowknight',
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          downloadUrl: 'https://exe.io/hk123',
        }),
      );
    });

    it('debe lanzar ConflictException si el slug ya existe', async () => {
      vi.mocked(repository.findBySlug).mockResolvedValue(buildGame());

      await expect(
        service.createGame({
          title: 'Hollow Knight',
          slug: 'hollow-knight',
          description: 'Desc',
          price: 10,
          stock: 10,
          coverImage: 'https://ejemplo.com/cover.jpg',
          developer: 'Dev',
          publisher: 'Pub',
          minimumRequirements: { os: '', storage: '', ram: '', cpu: '', gpu: '' },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getGames', () => {
    it('debe delegar en repository.findAll con filtros y paginación', async () => {
      const paginated = {
        items: [buildGame()],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(repository.findAll).mockResolvedValue(paginated);

      const result = await service.getGames({
        search: 'hollow',
        minPrice: 5,
        maxPrice: 20,
        page: 1,
        limit: 10,
      });

      expect(result).toBe(paginated);
      expect(repository.findAll).toHaveBeenCalledWith({
        search: 'hollow',
        genre: undefined,
        sortBy: undefined,
        minPrice: 5,
        maxPrice: 20,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getGameById / getGameBySlug', () => {
    it('debe retornar el juego si existe por ID', async () => {
      const game = buildGame();
      vi.mocked(repository.findById).mockResolvedValue(game);

      const result = await service.getGameById(ID);
      expect(result).toBe(game);
    });

    it('debe lanzar NotFoundException si no existe por ID', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.getGameById(ID)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el juego si existe por slug', async () => {
      const game = buildGame();
      vi.mocked(repository.findBySlug).mockResolvedValue(game);

      const result = await service.getGameBySlug('hollow-knight');
      expect(result).toBe(game);
    });

    it('debe lanzar NotFoundException si no existe por slug', async () => {
      vi.mocked(repository.findBySlug).mockResolvedValue(null);
      await expect(service.getGameBySlug('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGame', () => {
    it('debe actualizar el juego si existe', async () => {
      const game = buildGame();
      const updatedGame = buildGame({ title: 'Hollow Knight Silksong' });

      vi.mocked(repository.findById).mockResolvedValue(game);
      vi.mocked(repository.findBySlug).mockResolvedValue(null);
      vi.mocked(repository.update).mockResolvedValue(updatedGame);

      const result = await service.updateGame(ID, {
        title: 'Hollow Knight Silksong',
      });

      expect(result).toBe(updatedGame);
    });

    it('acorta downloadUrl al actualizar solo si viene en el DTO y es diferente al guardado', async () => {
      const existing = buildGame({ downloadUrl: 'https://exe.io/existing' });
      vi.mocked(repository.findById).mockResolvedValue(existing);
      vi.mocked(repository.update).mockResolvedValue(existing);

      // Misma URL -> no llama a ExeIoService
      await service.updateGame(ID, { downloadUrl: 'https://exe.io/existing' });
      expect(exeIoService.shortenUrl).not.toHaveBeenCalled();

      // Nueva URL -> sí llama a ExeIoService
      vi.mocked(exeIoService.shortenUrl).mockResolvedValueOnce(
        'https://exe.io/newshort',
      );
      await service.updateGame(ID, {
        downloadUrl: 'https://gofile.io/d/newfile',
      });
      expect(exeIoService.shortenUrl).toHaveBeenCalledWith(
        'https://gofile.io/d/newfile',
      );
      expect(repository.update).toHaveBeenLastCalledWith(
        ID,
        expect.objectContaining({ downloadUrl: 'https://exe.io/newshort' }),
      );
    });

    it('debe lanzar NotFoundException si el juego no existe al actualizar', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      vi.mocked(repository.findBySlug).mockResolvedValue(null);

      await expect(service.updateGame(ID, { title: 'Nuevo' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteGame', () => {
    it('debe eliminar lógicamente el juego si existe', async () => {
      const game = buildGame();
      vi.mocked(repository.findById).mockResolvedValue(game);
      vi.mocked(repository.delete).mockResolvedValue(true);

      const result = await service.deleteGame(ID);
      expect(result).toEqual({
        message: 'Juego eliminado correctamente (borrado lógico)',
        id: ID,
      });
    });

    it('debe lanzar NotFoundException si no existe el juego a eliminar', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      vi.mocked(repository.findBySlug).mockResolvedValue(null);

      await expect(service.deleteGame(ID)).rejects.toThrow(NotFoundException);
    });
  });
});
