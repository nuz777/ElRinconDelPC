/* oxlint-disable typescript/unbound-method */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameRepository } from '../../../Games/Domain/interfaces/game.repository.interface.js';
import type { ModRepository } from '../../../Mods/Domain/interfaces/mod.repository.interface.js';
import type { ToolRepository } from '../../../Tools/Domain/interfaces/tool.repository.interface.js';
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
      findByPublicCode: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new CatalogService(repository);
  });

  it('getItemByPublicCode normaliza el código y lo busca en el repositorio', async () => {
    const item = buildItem();
    vi.mocked(repository.findByPublicCode).mockResolvedValue(item);

    await expect(service.getItemByPublicCode(' A3F9K2 ')).resolves.toBe(item);
    expect(repository.findByPublicCode).toHaveBeenCalledWith('a3f9k2');
  });

  it('getItemByPublicCode lanza NotFoundException si el código no existe', async () => {
    vi.mocked(repository.findByPublicCode).mockResolvedValue(null);
    await expect(service.getItemByPublicCode('zzzzzz')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getItemByPublicCode rechaza códigos con formato inválido sin consultar la BD', async () => {
    await expect(service.getItemByPublicCode('no-valido')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findByPublicCode).not.toHaveBeenCalled();
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
      brand: null,
      console: null,
      emulator: null,
    });
    expect(result.version).toBe('v1.0');
  });

  it('createItem recorta espacios en minimumRequirements (os, cpu, ram, storage, gpu)', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildItem());

    await service.createItem({
      section: CatalogSection.JUEGOS,
      title: 'Elden Ring',
      genre: 'Aventura / RPG',
      shortDescription: 'RPG de acción.',
      minimumRequirements: {
        os: '  Windows 10 64-bit  ',
        cpu: '  Intel Core i5-8400  ',
        ram: '  12 GB RAM  ',
        storage: '  60 GB libres  ',
        gpu: '  NVIDIA GTX 1060 3GB  ',
      },
    });

    expect(repository.create).toHaveBeenCalledWith({
      section: CatalogSection.JUEGOS,
      title: 'Elden Ring',
      genre: 'Aventura / RPG',
      shortDescription: 'RPG de acción.',
      minimumRequirements: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-8400',
        ram: '12 GB RAM',
        storage: '60 GB libres',
        gpu: 'NVIDIA GTX 1060 3GB',
      },
      brand: null,
      console: null,
      emulator: null,
    });
  });

  it('createItem de una ROM exige marca y consola válidas', async () => {
    const base = {
      section: CatalogSection.ROMS,
      title: 'Homebrew Quest',
      genre: 'Plataformas',
      shortDescription: 'ROM homebrew de prueba.',
    };
    await expect(service.createItem(base)).rejects.toThrow(BadRequestException);
    await expect(
      service.createItem({ ...base, brand: 'Nintendo', console: 'PlayStation 2' }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('createItem de una ROM guarda marca, consola y emulador', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildItem());
    await service.createItem({
      section: CatalogSection.ROMS,
      title: 'Homebrew Quest',
      genre: 'Plataformas',
      shortDescription: 'ROM homebrew de prueba.',
      brand: ' Nintendo ',
      console: 'Nintendo 64',
      emulator: ' simple64 ',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        section: CatalogSection.ROMS,
        brand: 'Nintendo',
        console: 'Nintendo 64',
        emulator: 'simple64',
      }),
    );
  });

  it('createItem descarta marca/consola/emulador fuera de ROMs', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildItem());
    await service.createItem({
      section: CatalogSection.JUEGOS,
      title: 'Elden Ring',
      genre: 'Aventura / RPG',
      shortDescription: 'RPG.',
      brand: 'Nintendo',
      console: 'Nintendo 64',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ brand: null, console: null, emulator: null }),
    );
  });

  it('updateItem lanza NotFoundException si el ítem no existe', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
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

  it('sincroniza con games, mods y tools usando el mismo UUID al crear y eliminar', async () => {
    const gamesRepo: GameRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(true),
    };
    const modsRepo: ModRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
      gameExists: vi.fn(),
      findByGameId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(true),
      incrementDownloads: vi.fn(),
      approve: vi.fn(),
      getModDetails: vi.fn(),
    };
    const toolsRepo: ToolRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      hardDelete: vi.fn().mockResolvedValue(true),
      incrementDownloads: vi.fn(),
      slugExists: vi.fn().mockResolvedValue(false),
    };

    const syncedService = new CatalogService(
      repository,
      gamesRepo,
      modsRepo,
      toolsRepo,
    );

    vi.mocked(repository.create).mockResolvedValue(buildItem());
    await syncedService.createItem(
      {
        section: CatalogSection.JUEGOS,
        title: 'Elden Ring',
        genre: 'Aventura / RPG',
        shortDescription: 'RPG de acción en mundo abierto.',
      },
      'author-1',
    );
    expect(gamesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: ID, title: 'Elden Ring', slug: 'elden-ring' }),
    );

    vi.mocked(repository.delete).mockResolvedValue(true);
    await syncedService.deleteItem(ID);
    expect(gamesRepo.hardDelete).toHaveBeenCalledWith(ID);
    expect(modsRepo.hardDelete).toHaveBeenCalledWith(ID);
    expect(toolsRepo.hardDelete).toHaveBeenCalledWith(ID);
  });
});
