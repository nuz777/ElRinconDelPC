import type {
  CatalogItem,
  CatalogItemProps,
} from '../Entities/catalog-item.entity.js';
import type { CatalogSection } from '../Entities/catalog-section.enum.js';

/** Criterios de filtrado y paginación (independientes de la capa de presentación). */
export interface CatalogFilters {
  section?: CatalogSection;
  genre?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CreateCatalogItemData = Omit<
  CatalogItemProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateCatalogItemData = Partial<CreateCatalogItemData>;

export interface CatalogRepository {
  findAll(filters: CatalogFilters): Promise<PaginatedResult<CatalogItem>>;
  findById(id: string): Promise<CatalogItem | null>;
  create(item: CreateCatalogItemData): Promise<CatalogItem>;
  update(id: string, item: UpdateCatalogItemData): Promise<CatalogItem | null>;
  delete(id: string): Promise<boolean>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const CATALOG_REPOSITORY = Symbol('CATALOG_REPOSITORY');
