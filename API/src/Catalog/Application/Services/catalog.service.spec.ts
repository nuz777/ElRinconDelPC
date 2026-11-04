/* oxlint-disable typescript/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogItem } from '../../Domain/Entities/catalog-item.entity.js';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';
import type { CatalogRepository } from '../../Domain/interfaces/catalog.repository.interface.js';
import { CatalogService } from './catalog.service.js';

const ID = '7d1f2c4e-5b6a-4c3d-9e8f-0a1b2c3d4e5f';

const buildItem = (): CatalogItem =>
  new CatalogItem({
    id: ID,
    section: CatalogSection.JUEGOS,
    title: 'Elden Ring',
    genre: 'Aventura / RPG',
    shortDescription: 'RPG de acción en mundo abierto.',
  });

describe('CatalogService (Unit)', () => {
  let service: CatalogService;
  let repository: CatalogRepository;

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new CatalogService(repository);
  });

  it('getCatalog delega en el repositorio con los filtros y la paginación', async () => {
    const paginated = { items: [buildItem()], total: 1, page: 1, limit: 10, totalPages: 1 };
    vi.mocked(repository.findAll).mockResolvedValue(paginated);

    const result = await service.getCatalog({
      section: CatalogSection.JUEGOS,
      search: 'elden',
      page: 1,
      limit: 10,
    });

    expect(result).toBe(paginated);
    expect(repository.findAll).toHaveBeenCalledWith({
      section: CatalogSection.JUEGOS,
      search: 'elden',
      page: 1,
      limit: 10,
    });
  });

  it('getItemById lanza NotFoundException si no existe', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
    await expect(service.getItemById(ID)).rejects.toThrow(NotFoundException);
  });

  it('createItem recorta espacios y aplica versión por defecto en la entidad', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildItem());

    const result = await service.createItem({
      section: CatalogSection.JUEGOS,
      title: '  Elden Ring  ',
      genre: 'Aventura / RPG',
      shortDescription: ' RPG de acción en mundo abierto. ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      section: CatalogSection.JUEGOS,
      title: 'Elden Ring',
      genre: 'Aventura / RPG',
      shortDescription: 'RPG de acción en mundo abierto.',
    });
    expect(result.version).toBe('v1.0');
  });

  it('updateItem lanza NotFoundException si el repositorio retorna null', async () => {
    vi.mocked(repository.update).mockResolvedValue(null);
    await expect(service.updateItem(ID, { title: 'Nuevo' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deleteItem elimina y retorna confirmación', async () => {
    vi.mocked(repository.delete).mockResolvedValue(true);
    await expect(service.deleteItem(ID)).resolves.toEqual({
      message: 'Ítem eliminado correctamente',
      id: ID,
    });
  });

  it('deleteItem lanza NotFoundException si no existe', async () => {
    vi.mocked(repository.delete).mockResolvedValue(false);
    await expect(service.deleteItem(ID)).rejects.toThrow(NotFoundException);
  });
});
