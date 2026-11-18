/* oxlint-disable typescript/unbound-method */
import type { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TypeormGameRepository } from './game.typeorm-repository.js';

const GAME_ID = '11111111-2222-3333-4444-555555555555';

const buildGameRow = (override: Record<string, unknown> = {}) => ({
  id: GAME_ID,
  title: 'Hollow Knight',
  slug: 'hollow-knight',
  description: 'Metroidvania',
  price: '0.00',
  discount_price: null,
  stock: 100,
  genres: ['Metroidvania', 'Indie'],
  cover_image: 'https://example.com/cover.jpg',
  banner_image: null,
  developer: 'Team Cherry',
  publisher: 'Team Cherry',
  release_date: '2017-02-24T00:00:00Z',
  is_active: true,
  min_os: 'Windows 10',
  min_storage: '9 GB',
  min_ram: '4 GB',
  min_cpu: 'i3',
  min_gpu: 'GTX 560',
  minimum_requirements: {
    os: 'Windows 10',
    storage: '9 GB',
    ram: '4 GB',
    cpu: 'i3',
    gpu: 'GTX 560',
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...override,
});

describe('TypeormGameRepository (Unit)', () => {
  let repo: TypeormGameRepository;
  let dataSource: DataSource;

  beforeEach(() => {
    dataSource = {
      query: vi.fn(),
    } as unknown as DataSource;
    repo = new TypeormGameRepository(dataSource);
  });

  describe('create', () => {
    it('inserta con id explícito usando 20 parámetros cuando se provee data.id', async () => {
      vi.mocked(dataSource.query).mockResolvedValue([buildGameRow()]);

      const game = await repo.create({
        id: GAME_ID,
        title: 'Hollow Knight',
        slug: 'hollow-knight',
        description: 'Metroidvania',
        price: 0,
        stock: 100,
        genres: ['Metroidvania'],
        coverImage: 'cover.jpg',
        developer: 'Team Cherry',
        publisher: 'Team Cherry',
        minimumRequirements: {
          os: 'Windows 10',
          storage: '9 GB',
          ram: '4 GB',
          cpu: 'i3',
          gpu: 'GTX 560',
        },
      });

      expect(dataSource.query).toHaveBeenCalledOnce();
      const [sql, params] = vi.mocked(dataSource.query).mock.calls[0];
      expect(sql).toContain('INSERT INTO games');
      expect(params).toHaveLength(20);
      expect(game.id).toBe(GAME_ID);
    });

    it('inserta sin id usando 19 parámetros cuando no se provee data.id', async () => {
      vi.mocked(dataSource.query).mockResolvedValue([buildGameRow()]);

      await repo.create({
        title: 'Hollow Knight',
        slug: 'hollow-knight',
        description: 'Metroidvania',
        price: 15,
        stock: 10,
        genres: [],
        coverImage: 'cover.jpg',
        developer: 'Team Cherry',
        publisher: 'Team Cherry',
      });

      const [, params] = vi.mocked(dataSource.query).mock.calls[0];
      expect(params).toHaveLength(19);
    });
  });

  describe('findById', () => {
    it('retorna el juego mapeado cuando existe', async () => {
      vi.mocked(dataSource.query).mockResolvedValue([buildGameRow()]);
      const game = await repo.findById(GAME_ID);
      expect(game?.title).toBe('Hollow Knight');
      expect(game?.price).toBe(0);
    });

    it('retorna null sin consultar PostgreSQL si el id no es UUID y propaga errores reales de BD', async () => {
      await expect(repo.findById('hollow-knight')).resolves.toBeNull();
      expect(dataSource.query).not.toHaveBeenCalled();

      vi.mocked(dataSource.query).mockRejectedValue(new Error('connection lost'));
      await expect(repo.findById(GAME_ID)).rejects.toThrow('connection lost');
    });
  });

  describe('findAll', () => {
    it('ejecuta SELECT * y SELECT COUNT(*) en paralelo y sanitiza sortBy/LIKE', async () => {
      vi.mocked(dataSource.query)
        .mockResolvedValueOnce([buildGameRow()])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await repo.findAll({
        search: '100%_test',
        genre: 'Indie',
        minPrice: 0,
        maxPrice: 20,
        sortBy: 'invalid_column; DROP TABLE games;',
        page: 1,
        limit: 10,
      });

      expect(dataSource.query).toHaveBeenCalledTimes(2);
      const [selectSql, selectParams] = vi.mocked(dataSource.query).mock.calls[0];
      expect(selectSql).toContain('ORDER BY created_at DESC');
      expect(selectParams).toContain('%100\\%\\_test%');
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('ejecuta una única consulta UPDATE ... RETURNING * con merge JSONB atómico', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([
        buildGameRow({ title: 'Silksong' }),
      ]);

      const updated = await repo.update(GAME_ID, {
        title: 'Silksong',
        minimumRequirements: {
          os: 'Win 11',
          storage: '10 GB',
          ram: '8 GB',
          cpu: 'i5',
          gpu: 'GTX 1060',
        },
      });

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(vi.mocked(dataSource.query).mock.calls[0][0]).toContain('RETURNING *');
      expect(updated?.title).toBe('Silksong');
    });

    it('retorna null en 1 consulta si el juego no existe', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([]);
      await expect(repo.update(GAME_ID, { title: 'X' })).resolves.toBeNull();
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete / hardDelete', () => {
    it('delete realiza una única consulta UPDATE ... WHERE is_active = TRUE RETURNING id', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([{ id: GAME_ID }]);

      await expect(repo.delete(GAME_ID)).resolves.toBe(true);
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });

    it('delete retorna false en 1 consulta si no había fila activa', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([]);

      await expect(repo.delete(GAME_ID)).resolves.toBe(false);
      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });

    it('hardDelete ejecuta DELETE ... RETURNING id', async () => {
      vi.mocked(dataSource.query).mockResolvedValueOnce([{ id: GAME_ID }]);
      await expect(repo.hardDelete(GAME_ID)).resolves.toBe(true);
    });
  });
});
