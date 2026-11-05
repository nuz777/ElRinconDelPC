import type { Mod, ModProps } from '../Entities/mod.entity.js';

/** Criterios de filtrado y paginación (independientes de la capa de presentación). */
export interface ModFilters {
  gameId?: string;
  authorId?: string;
  isApproved?: boolean;
  isActive?: boolean;
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

export type CreateModData = Omit<
  ModProps,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateModData = Partial<CreateModData>;

export interface ModRepository {
  create(data: CreateModData): Promise<Mod>;
  findById(id: string): Promise<Mod | null>;
  findBySlug(slug: string): Promise<Mod | null>;
  findByGameId(
    gameId: string,
    filters: ModFilters,
  ): Promise<PaginatedResult<Mod>>;
  update(id: string, data: UpdateModData): Promise<Mod | null>;
  /** Borrado lógico: marca `isActive = false` en lugar de eliminar la fila. */
  delete(id: string): Promise<boolean>;
  /** Incrementa el contador de descargas del mod. */
  incrementDownloads(id: string): Promise<void>;
  /** Aprueba un mod pendiente (marca isApproved = true). */
  approve(id: string): Promise<boolean>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const MODS_REPOSITORY = Symbol('MODS_REPOSITORY');
