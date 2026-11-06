import type { Game, GameProps } from '../Entities/game.entity.js';

/** Criterios de filtrado y paginación (independientes de la capa de presentación). */
export interface GameFilters {
  search?: string;
  genre?: string;
  isActive?: boolean;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
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

export type CreateGameData = Omit<GameProps, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateGameData = Partial<CreateGameData>;

export interface GameRepository {
  create(data: CreateGameData): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findBySlug(slug: string): Promise<Game | null>;
  findAll(filters: GameFilters): Promise<PaginatedResult<Game>>;
  update(id: string, data: UpdateGameData): Promise<Game | null>;
  /** Borrado lógico: marca `isActive = false` en lugar de eliminar la fila. */
  delete(id: string): Promise<boolean>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const GAMES_REPOSITORY = Symbol('GAMES_REPOSITORY');
