/* oxlint-disable typescript/unbound-method */
import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';
import type { CatalogItemTypeormEntity } from '../entities/catalog-item.typeorm-entity.js';
import {
  CATALOG_MEDIA_PLACEHOLDER,
  TypeormCatalogRepository,
} from './typeorm-catalog.repository.js';

const ITEM_ID = '11111111-2222-3333-4444-555555555555';

const buildRow = (
  override: Partial<CatalogItemTypeormEntity> = {},
): CatalogItemTypeormEntity => ({
  id: ITEM_ID,
  section: CatalogSection.JUEGOS,
  title: 'Elden Ring',
  genre: 'Aventura / RPG',
  size: '60 GB',
  version: 'v1.0',
  badge: 'Nuevo',
  coverUrl: CATALOG_MEDIA_PLACEHOLDER,
  coverFraming: null,
  bannerFraming: null,
  bannerUrl: CATALOG_MEDIA_PLACEHOLDER,
  downloadUrl: 'https://example.com/elden-ring',
  developer: 'FromSoftware',
  shortDescription: 'RPG de acción en mundo abierto.',
  minimumRequirements: {
    os: 'Windows 10',
    cpu: 'i5',
    ram: '12 GB',
    storage: '60 GB',
    gpu: 'GTX 1060',
  },
  publicCode: 'a3f9k2',
  brand: null,
  console: null,
  emulator: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...override,
});

describe('TypeormCatalogRepository (Unit)', () => {
  let repo: TypeormCatalogRepository;
  let ormRepo: Repository<CatalogItemTypeormEntity>;
  let qb: {
    andWhere: ReturnType<typeof vi.fn>;
    clone: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    offset: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    getRawMany: ReturnType<typeof vi.fn>;
    getRawOne: ReturnType<typeof vi.fn>;
    getCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    qb = {
      andWhere: vi.fn().mockReturnThis(),
      clone: vi.fn(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ raw: [buildRow()] }),
      getRawMany: vi.fn().mockResolvedValue([buildRow()]),
      getRawOne: vi.fn().mockResolvedValue({
        value: 'data:image/webp;base64,AAA',
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      }),
      getCount: vi.fn().mockResolvedValue(1),
    };
    qb.clone.mockReturnValue(qb);

    ormRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(qb),
      findOne: vi.fn(),
      create: vi.fn((entity) => entity as CatalogItemTypeormEntity),
      save: vi.fn(async (entity) => entity as CatalogItemTypeormEntity),
      delete: vi.fn(),
    } as unknown as Repository<CatalogItemTypeormEntity>;

    repo = new TypeormCatalogRepository(ormRepo);
  });

  describe('findAll', () => {
    it('aplica proyección de columnas (.select) y ejecuta getRawMany + getCount en paralelo', async () => {
      const result = await repo.findAll({
        section: CatalogSection.JUEGOS,
        genre: 'Acción_100%',
        search: 'el%den_',
        page: 2,
        limit: 10,
      });

      expect(ormRepo.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(qb.andWhere).toHaveBeenCalledWith('item.genre ILIKE :genre', {
        genre: 'Acción\\_100\\%',
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(item.title ILIKE :search OR item.developer ILIKE :search)',
        { search: '%el\\%den\\_%' },
      );
      expect(qb.select).toHaveBeenCalledOnce();
      expect(qb.offset).toHaveBeenCalledWith(10);
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(qb.getRawMany).toHaveBeenCalledOnce();
      expect(qb.getCount).toHaveBeenCalledOnce();
      expect(result.items[0].coverUrl).toBe(CATALOG_MEDIA_PLACEHOLDER);
      expect(result.totalPages).toBe(1);
    });

    it('omite bannerUrl y minimumRequirements cuando summary=true y excluye ADULTOS cuando no se especifica section', async () => {
      await repo.findAll({ page: 1, limit: 10, summary: true });

      expect(qb.andWhere).toHaveBeenCalledWith('item.section != :adultSection', {
        adultSection: CatalogSection.ADULTOS,
      });
      const selectedCols = vi.mocked(qb.select).mock.calls[0][0] as string[];
      expect(selectedCols.some((c) => c.includes('banner_url'))).toBe(false);
      expect(selectedCols.some((c) => c.includes('minimum_requirements'))).toBe(false);
    });
  });

  describe('findById / findByPublicCode / findMedia', () => {
    it('encuentra por id, publicCode o media', async () => {
      vi.mocked(ormRepo.findOne).mockResolvedValueOnce(buildRow());
      await expect(repo.findById(ITEM_ID)).resolves.toMatchObject({ id: ITEM_ID });

      vi.mocked(ormRepo.findOne).mockResolvedValueOnce(buildRow());
      await expect(repo.findByPublicCode('a3f9k2')).resolves.toMatchObject({
        publicCode: 'a3f9k2',
      });

      const media = await repo.findMedia(ITEM_ID, 'cover');
      expect(media?.value).toBe('data:image/webp;base64,AAA');
    });
  });

  describe('create', () => {
    it('inserta directamente sin SELECT exists() y solo reintenta ante error 23505', async () => {
      const row = buildRow();
      vi.mocked(ormRepo.save)
        .mockRejectedValueOnce({ code: '23505' })
        .mockResolvedValueOnce(row);

      const created = await repo.create({
        section: CatalogSection.JUEGOS,
        title: 'Elden Ring',
        genre: 'RPG',
        shortDescription: 'Desc',
      });

      expect(ormRepo.save).toHaveBeenCalledTimes(2);
      expect(created.id).toBe(ITEM_ID);
    });

    it('lanza error si fallan 10 intentos por colisión 23505', async () => {
      vi.mocked(ormRepo.save).mockRejectedValue({ code: '23505' });

      await expect(
        repo.create({
          section: CatalogSection.JUEGOS,
          title: 'Elden Ring',
          genre: 'RPG',
          shortDescription: 'Desc',
        }),
      ).rejects.toThrow('No se pudo generar un código público único');
    });
  });

  describe('update', () => {
    it('ejecuta UPDATE directo con RETURNING sin findOne previo y protege publicCode', async () => {
      const updated = await repo.update(ITEM_ID, {
        title: 'Nuevo título',
        publicCode: 'hacked',
      } as unknown as Parameters<TypeormCatalogRepository['update']>[1]);

      expect(ormRepo.findOne).not.toHaveBeenCalled();
      expect(qb.update).toHaveBeenCalledOnce();
      expect(qb.set).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Nuevo título' }),
      );
      expect(vi.mocked(qb.set).mock.calls[0][0]).not.toHaveProperty('publicCode');
      expect(qb.returning).toHaveBeenCalledOnce();
      expect(updated?.publicCode).toBe('a3f9k2');
    });

    it('retorna null si UPDATE RETURNING no devuelve filas', async () => {
      qb.execute.mockResolvedValue({ raw: [] });
      await expect(repo.update(ITEM_ID, { title: 'X' })).resolves.toBeNull();
    });
  });

  describe('delete', () => {
    it('retorna true cuando affected > 0 y false cuando es 0', async () => {
      vi.mocked(ormRepo.delete).mockResolvedValueOnce({ raw: [], affected: 1 });
      await expect(repo.delete(ITEM_ID)).resolves.toBe(true);

      vi.mocked(ormRepo.delete).mockResolvedValueOnce({ raw: [], affected: 0 });
      await expect(repo.delete(ITEM_ID)).resolves.toBe(false);
    });
  });
});
