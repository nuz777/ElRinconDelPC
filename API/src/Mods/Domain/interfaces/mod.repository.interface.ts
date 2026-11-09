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
> & { id?: string };

export type UpdateModData = Partial<CreateModData>;

export interface ModRepository {
  create(data: CreateModData): Promise<Mod>;
  findById(id: string): Promise<Mod | null>;
  findBySlug(slug: string, gameId: string | null): Promise<Mod | null>;
  gameExists(gameId: string): Promise<boolean>;
  findByGameId(
    gameId: string,
    filters: ModFilters,
  ): Promise<PaginatedResult<Mod>>;
  update(id: string, data: UpdateModData): Promise<Mod | null>;
  /** Borrado lógico: marca `isActive = false` en lugar de eliminar la fila. */
  delete(id: string): Promise<boolean>;
  /** Borrado físico por ID para sincronización con el catálogo. */
  hardDelete?(id: string): Promise<boolean>;
  /** Incrementa el contador de descargas del mod. */
  incrementDownloads(id: string): Promise<void>;
  /** Aprueba un mod pendiente (marca isApproved = true). */
  approve(id: string): Promise<boolean>;
  /** Obtiene detalles relacionados (juego y autor) sin exponer datos sensibles del autor. */
  getModDetails(id: string): Promise<{
    game: { id: string; title: string } | null;
    author: { id: string } | null;
  } | null>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const MODS_REPOSITORY = Symbol('MODS_REPOSITORY');
