import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CatalogItem } from '../../Domain/Entities/catalog-item.entity.js';
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
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
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

  createItem(data: CreateCatalogItemData): Promise<CatalogItem> {
    return this.catalogRepository.create(this.normalize(data));
  }

  async updateItem(
    id: string,
    data: UpdateCatalogItemData,
  ): Promise<CatalogItem> {
    const updated = await this.catalogRepository.update(id, this.normalize(data));
    if (!updated) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    return updated;
  }

  async deleteItem(id: string): Promise<{ message: string; id: string }> {
    const deleted = await this.catalogRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Ítem del catálogo con id "${id}" no encontrado`);
    }
    return { message: 'Ítem eliminado correctamente', id };
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
    return result;
  }
}
