import type { Tool, ToolProps } from '../Entities/tool.entity.js';

/** Criterios de filtrado y paginación (independientes de la capa de presentación). */
export interface ToolFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
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

export type CreateToolData = Omit<ToolProps, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type UpdateToolData = Partial<CreateToolData>;

export interface ToolRepository {
  create(data: CreateToolData): Promise<Tool>;
  findById(id: string): Promise<Tool | null>;
  findBySlug(slug: string): Promise<Tool | null>;
  findAll(filters: ToolFilters): Promise<PaginatedResult<Tool>>;
  update(id: string, data: UpdateToolData): Promise<Tool | null>;
  /** Borrado lógico: marca `isActive = false` en lugar de eliminar la fila. */
  delete(id: string): Promise<boolean>;
  /** Borrado físico por ID para sincronización con el catálogo. */
  hardDelete?(id: string): Promise<boolean>;
  /** Incrementa el contador de descargas de la herramienta. */
  incrementDownloads(id: string): Promise<void>;
  /** Verifica si existe una herramienta con el slug dado. */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

/** Token de inyección para vincular la interfaz con su implementación concreta. */
export const TOOLS_REPOSITORY = Symbol('TOOLS_REPOSITORY');
