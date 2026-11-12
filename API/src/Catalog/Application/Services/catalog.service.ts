import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { isValidPublicCode } from '../../../Common/utils/public-code.js';
import { slugify } from '../../../Common/utils/slugify.js';
import {
  GAMES_REPOSITORY,
  type GameRepository,
} from '../../../Games/Domain/interfaces/game.repository.interface.js';
import {
  MODS_REPOSITORY,
  type ModRepository,
} from '../../../Mods/Domain/interfaces/mod.repository.interface.js';
import {
  TOOLS_REPOSITORY,
  type ToolRepository,
} from '../../../Tools/Domain/interfaces/tool.repository.interface.js';
import type { CatalogItem } from '../../Domain/Entities/catalog-item.entity.js';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';
import { isValidRomPlatform } from '../../Domain/Entities/rom-platforms.js';
import {
  CATALOG_REPOSITORY,
  type CatalogFilters,
  type CatalogRepository,
  type CreateCatalogItemData,
  type PaginatedResult,
  type UpdateCatalogItemData,
} from '../../Domain/interfaces/catalog.repository.interface.js';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
    @Optional()
    @Inject(GAMES_REPOSITORY)
    private readonly gamesRepository?: GameRepository,
    @Optional()
    @Inject(MODS_REPOSITORY)
    private readonly modsRepository?: ModRepository,
    @Optional()
    @Inject(TOOLS_REPOSITORY)
    private readonly toolsRepository?: ToolRepository,
  ) {}

  getCatalog(filters: CatalogFilters): Promise<PaginatedResult<CatalogItem>> {
    return this.catalogRepository.findAll({
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    });
  }

  async getItemById(id: string): Promise<CatalogItem> {
    const item = await this.catalogRepository.findById(id);
    if (!item) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    return item;
  }

  /** Busca un ítem por su código público fijo (el que va al final de la URL compartible). */
  async getItemByPublicCode(code: string): Promise<CatalogItem> {
    const normalized = code.trim().toLowerCase();
    const item = isValidPublicCode(normalized)
      ? await this.catalogRepository.findByPublicCode(normalized)
      : null;
    if (!item) {
      throw new NotFoundException(`Ítem del catálogo con código "${code}" no encontrado`);
    }
    return item;
  }

  async createItem(
    data: CreateCatalogItemData,
    authorId?: string,
  ): Promise<CatalogItem> {
    const saved = await this.catalogRepository.create(
      this.applyRomRules(this.normalize(data), data.section),
    );
    try {
      await this.syncCreateToSpecificTable(saved, authorId);
    } catch (err) {
      this.logger.warn(
        `Error sincronizando ítem "${saved.id}" con su tabla específica: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return saved;
  }

  async updateItem(
    id: string,
    data: UpdateCatalogItemData,
  ): Promise<CatalogItem> {
    const existing = await this.catalogRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    // Validar marca/consola sobre el resultado final (lo existente + los cambios)
    const normalized = this.normalize(data);
    const section = normalized.section ?? existing.section;
    const merged = this.applyRomRules(
      {
        ...normalized,
        brand: normalized.brand ?? existing.brand ?? undefined,
        console: normalized.console ?? existing.console ?? undefined,
        emulator: normalized.emulator ?? existing.emulator ?? undefined,
      },
      section,
    );
    const updated = await this.catalogRepository.update(id, merged);
    if (!updated) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    try {
      await this.syncUpdateToSpecificTables(updated);
    } catch (err) {
      this.logger.warn(
        `Error sincronizando actualización del ítem "${id}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return updated;
  }

  async deleteItem(id: string): Promise<{ message: string; id: string }> {
    const deleted = await this.catalogRepository.delete(id);
    try {
      await this.syncDeleteFromSpecificTables(id);
    } catch (err) {
      this.logger.warn(
        `Error sincronizando borrado del ítem "${id}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (!deleted) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    return { message: 'Ítem eliminado correctamente', id };
  }

  /** Sincroniza el ítem recién creado en catalog_items hacia su tabla específica (games, mods o tools) con el mismo UUID. */
  private async syncCreateToSpecificTable(
    saved: CatalogItem,
    authorId?: string,
  ): Promise<void> {
    const baseSlug = slugify(saved.title) || `item-${saved.id.slice(0, 8)}`;

    if (saved.section === CatalogSection.JUEGOS && this.gamesRepository) {
      let slug = baseSlug;
      const existingSlug = await this.gamesRepository.findBySlug(slug);
      if (existingSlug && existingSlug.id !== saved.id) {
        slug = `${baseSlug}-${saved.id.slice(0, 6)}`;
      }

      await this.gamesRepository.create({
        id: saved.id,
        title: saved.title,
        slug,
        description: saved.shortDescription,
        price: 0,
        discountPrice: null,
        stock: 100,
        genres: [saved.genre],
        coverImage: saved.coverUrl ?? '/img/indicado.webp',
        bannerImage: saved.bannerUrl ?? null,
        developer: saved.developer ?? 'Comunidad El Sótano',
        publisher: saved.developer ?? 'Comunidad El Sótano',
        releaseDate: saved.createdAt,
        isActive: true,
        minimumRequirements: saved.minimumRequirements ?? {
          os: 'Windows 10 / 11 64-bit',
          cpu: 'Procesador de 2 o 4 núcleos',
          ram: '4 GB RAM',
          storage: saved.size ?? '2 GB libres',
          gpu: 'GPU compatible con DirectX 11',
        },
      });
      return;
    }

    if (
      saved.section === CatalogSection.MODS &&
      this.modsRepository &&
      authorId
    ) {
      let slug = baseSlug;
      const existingSlug = await this.modsRepository.findBySlug(slug, null);
      if (existingSlug && existingSlug.id !== saved.id) {
        slug = `${baseSlug}-${saved.id.slice(0, 6)}`;
      }

      await this.modsRepository.create({
        id: saved.id,
        title: saved.title,
        slug,
        description: saved.shortDescription,
        version: saved.version || 'v1.0',
        downloadUrl: saved.downloadUrl ?? '#',
        fileSize: saved.size,
        thumbnailUrl: saved.coverUrl,
        gameId: null,
        authorId,
        downloadsCount: 0,
        isApproved: true,
        isActive: true,
        minimumRequirements: saved.minimumRequirements ?? {
          os: 'Windows 10 / 11 64-bit',
          cpu: 'Procesador de 2 o 4 núcleos',
          ram: '4 GB RAM',
          storage: saved.size ?? '1 GB libre',
          gpu: 'GPU compatible con DirectX 11',
        },
      });
      return;
    }

    if (
      saved.section === CatalogSection.HERRAMIENTAS &&
      this.toolsRepository &&
      authorId
    ) {
      let slug = baseSlug;
      const exists = await this.toolsRepository.slugExists(slug);
      if (exists) {
        slug = `${baseSlug}-${saved.id.slice(0, 6)}`;
      }

      await this.toolsRepository.create({
        id: saved.id,
        title: saved.title,
        slug,
        description: saved.shortDescription,
        category: saved.genre || 'Utilidades',
        version: saved.version || 'v1.0',
        size: saved.size,
        downloadUrl: saved.downloadUrl ?? '#',
        imageUrl: saved.coverUrl,
        tags: saved.badge ? [saved.badge] : [],
        authorId,
        downloadsCount: 0,
        isActive: true,
      });
    }
  }

  /** Sincroniza la actualización con games, mods o tools si existe el registro espejo. */
  private async syncUpdateToSpecificTables(updated: CatalogItem): Promise<void> {
    if (updated.section === CatalogSection.JUEGOS && this.gamesRepository) {
      await this.gamesRepository.update(updated.id, {
        title: updated.title,
        description: updated.shortDescription,
        genres: [updated.genre],
        coverImage: updated.coverUrl ?? '/img/indicado.webp',
        bannerImage: updated.bannerUrl ?? null,
        developer: updated.developer ?? 'Comunidad El Sótano',
        publisher: updated.developer ?? 'Comunidad El Sótano',
        minimumRequirements: updated.minimumRequirements ?? undefined,
      });
    }
  }

  /** Elimina el registro espejo en games, mods y tools cuando se borra del catálogo. */
  private async syncDeleteFromSpecificTables(id: string): Promise<void> {
    await Promise.all([
      this.gamesRepository?.hardDelete
        ? this.gamesRepository.hardDelete(id)
        : this.gamesRepository?.delete(id),
      this.modsRepository?.hardDelete
        ? this.modsRepository.hardDelete(id)
        : this.modsRepository?.delete(id),
      this.toolsRepository?.hardDelete
        ? this.toolsRepository.hardDelete(id)
        : this.toolsRepository?.delete(id),
    ]);
  }

  /**
   * ROMs: marca y consola obligatorias y deben existir en ROM_PLATFORMS.
   * ADULTOS (juegos H): no tienen apartado de requisitos (minimumRequirements se guarda como null).
   * Otros apartados: marca, consola y emulador se descartan (null).
   */
  private applyRomRules<T extends UpdateCatalogItemData>(
    data: T,
    section: CatalogSection | undefined,
  ): T {
    if (section !== CatalogSection.ROMS) {
      return {
        ...data,
        brand: null,
        console: null,
        emulator: null,
        ...(section === CatalogSection.ADULTOS ? { minimumRequirements: null } : {}),
      };
    }
    const brand = data.brand?.trim();
    const consoleName = data.console?.trim();
    if (!brand || !consoleName) {
      throw new BadRequestException(
        'Las ROMs requieren una marca y una consola',
      );
    }
    if (!isValidRomPlatform(brand, consoleName)) {
      throw new BadRequestException(
        `La consola "${consoleName}" no pertenece a la marca "${brand}"`,
      );
    }
    return {
      ...data,
      brand,
      console: consoleName,
      emulator: data.emulator?.trim() || null,
    };
  }

  /** Recorta espacios de los campos de texto presentes sin tocar los ausentes. */
  private normalize<T extends UpdateCatalogItemData>(data: T): T {
    const result = { ...data };
    for (const key of Object.keys(result) as (keyof T)[]) {
      const value = result[key];
      if (typeof value === 'string') {
        result[key] = value.trim() as T[keyof T];
      }
    }
    if (result.minimumRequirements) {
      result.minimumRequirements = {
        os: result.minimumRequirements.os.trim(),
        cpu: result.minimumRequirements.cpu.trim(),
        ram: result.minimumRequirements.ram.trim(),
        storage: result.minimumRequirements.storage.trim(),
        gpu: result.minimumRequirements.gpu.trim(),
      };
    }
    return result;
  }
}
