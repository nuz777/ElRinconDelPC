/* oxlint-disable typescript/unbound-method */
import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogService } from '../Application/Services/catalog.service.js';
import { CatalogItem } from '../Domain/Entities/catalog-item.entity.js';
import { CatalogSection } from '../Domain/Entities/catalog-section.enum.js';
import { CATALOG_MEDIA_PLACEHOLDER } from '../Infraestructure/repositories/typeorm-catalog.repository.js';
import { CatalogController } from './catalog.controller.js';

const ID = '11111111-2222-3333-4444-555555555555';

const buildItem = (override: Partial<CatalogItem> = {}): CatalogItem =>
  new CatalogItem({
    id: ID,
    section: CatalogSection.JUEGOS,
    title: 'Elden Ring',
    genre: 'RPG',
    shortDescription: 'Desc',
    publicCode: 'a3f9k2',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...override,
  });

describe('CatalogController (Unit)', () => {
  let controller: CatalogController;
  let catalogService: CatalogService;

  beforeEach(() => {
    catalogService = {
      getCatalog: vi.fn(),
      getItemByPublicCode: vi.fn(),
      getItemById: vi.fn(),
      getItemMedia: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
    } as unknown as CatalogService;
    controller = new CatalogController(catalogService);
  });

  it('findAll delega filtros (incluyendo summary) y resuelve placeholders __MEDIA__', async () => {
    const item = buildItem({
      coverUrl: CATALOG_MEDIA_PLACEHOLDER,
      bannerUrl: CATALOG_MEDIA_PLACEHOLDER,
    });
    const paginated = { items: [item], total: 1, page: 1, limit: 10, totalPages: 1 };
    vi.mocked(catalogService.getCatalog).mockResolvedValue(paginated);

    const req = {
      protocol: 'https',
      get: vi.fn().mockReturnValue('api.sotano.com'),
    } as unknown as Request;

    const result = await controller.findAll(
      { section: CatalogSection.JUEGOS, page: 1, limit: 10, view: 'summary' },
      req,
    );

    expect(catalogService.getCatalog).toHaveBeenCalledWith({
      section: CatalogSection.JUEGOS,
      page: 1,
      limit: 10,
      summary: true,
    });
    expect(result.items[0].coverUrl).toBe(
      `https://api.sotano.com/catalog/${ID}/media/cover?v=${item.updatedAt.getTime()}`,
    );
    expect(result.items[0].bannerUrl).toBe(
      `https://api.sotano.com/catalog/${ID}/media/banner?v=${item.updatedAt.getTime()}`,
    );
  });

  it('getMedia decodifica data:image base64 con headers de caché y soporta 304 ETag', async () => {
    const base64 = Buffer.from('fake-webp').toString('base64');
    const updatedAt = new Date('2026-01-01T00:00:00Z');
    vi.mocked(catalogService.getItemMedia).mockResolvedValue({
      value: `data:image/webp;base64,${base64}`,
      updatedAt,
    });

    const headers: Record<string, unknown> = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn((k: string, v: unknown) => {
        headers[k] = v;
        return res;
      }),
      send: vi.fn(),
      end: vi.fn(),
      redirect: vi.fn(),
    } as unknown as Response;

    await controller.getMedia(
      ID,
      'cover',
      { headers: {}, query: { v: '1' } } as unknown as Request,
      res,
    );

    expect(headers['Content-Type']).toBe('image/webp');
    expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(res.send).toHaveBeenCalledWith(Buffer.from('fake-webp'));

    await controller.getMedia(
      ID,
      'cover',
      {
        headers: { 'if-none-match': `"${ID}-cover-${updatedAt.getTime()}"` },
        query: {},
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();

    await expect(
      controller.getMedia(ID, 'invalido', { headers: {} } as unknown as Request, res),
    ).rejects.toThrow(BadRequestException);
  });

  it('findByCode, findOne, create, replace, update y remove delegan correctamente', async () => {
    const item = buildItem();
    vi.mocked(catalogService.getItemByPublicCode).mockResolvedValue(item);
    vi.mocked(catalogService.getItemById).mockResolvedValue(item);
    vi.mocked(catalogService.createItem).mockResolvedValue(item);
    vi.mocked(catalogService.updateItem).mockResolvedValue(item);
    vi.mocked(catalogService.deleteItem).mockResolvedValue({
      message: 'Ítem eliminado correctamente',
      id: ID,
    });

    await expect(controller.findByCode('a3f9k2')).resolves.toBe(item);
    await expect(controller.findOne(ID)).resolves.toBe(item);
    await expect(
      controller.create(
        { section: CatalogSection.JUEGOS, title: 'Elden Ring', genre: 'RPG', shortDescription: 'D' },
        { user: { id: 'u-1' } },
      ),
    ).resolves.toBe(item);
    await expect(controller.replace(ID, { title: 'A' })).resolves.toBe(item);
    await expect(controller.update(ID, { title: 'B' })).resolves.toBe(item);
    await expect(controller.remove(ID)).resolves.toEqual({
      message: 'Ítem eliminado correctamente',
      id: ID,
    });
  });
});
