import { authService } from "./auth.service";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface GameApiResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  genres: string[];
  coverImage: string;
  bannerImage: string | null;
  developer: string;
  publisher: string;
  releaseDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedGamesResponse {
  items: GameApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateGamePayload {
  title: string;
  slug?: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  genres?: string[];
  coverImage: string;
  bannerImage?: string | null;
  developer: string;
  publisher: string;
  releaseDate?: string;
  isActive?: boolean;
}

export interface UpdateGamePayload {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
  genres?: string[];
  coverImage?: string;
  bannerImage?: string | null;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  isActive?: boolean;
}

export interface GameFilterParams {
  search?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data) {
    return record.data as T;
  }
  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
}

export const gamesService = {
  /** Listado paginado de juegos con filtros (ruta pública). */
  async getGames(filters: GameFilterParams = {}): Promise<PaginatedGamesResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));

    const res = await fetch(`${API_BASE_URL}/games?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error("No se pudo obtener el listado de juegos desde el servidor.");
    }

    const rawJson: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<PaginatedGamesResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al obtener juegos.");
    }
    return data;
  },

  /** Detalle de un juego por ID o slug (ruta pública). */
  async getGameById(idOrSlug: string): Promise<GameApiResponse> {
    const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(idOrSlug)}`, {
      credentials: "include",
    });
    if (res.status === 404) {
      throw new Error("Juego no encontrado.");
    }
    if (!res.ok) {
      throw new Error("No se pudo obtener el detalle del juego.");
    }

    const rawJson: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<GameApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al obtener el juego.");
    }
    return data;
  },

  /** Crear un nuevo juego (solo ADMIN). Envía cookie JWT (credentials: include). */
  async createGame(payload: CreateGamePayload): Promise<GameApiResponse> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere iniciar sesión como administrador.");
    }

    const res = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const rawJson: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      let message = "Error al crear el juego en el servidor.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        message = extractErrorMessage(rawJson, message);
      }
      throw new Error(message);
    }

    const data = unwrapApiData<GameApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al crear el juego.");
    }
    return data;
  },

  /** Actualizar un juego existente (solo ADMIN). */
  async updateGame(
    id: string,
    payload: UpdateGamePayload,
  ): Promise<GameApiResponse> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere iniciar sesión como administrador.");
    }

    const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const rawJson: unknown = await res.json().catch(() => null);

    if (res.status === 404) {
      throw new Error("Juego no encontrado.");
    }
    if (!res.ok) {
      let message = "Error al actualizar el juego en el servidor.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        message = extractErrorMessage(rawJson, message);
      }
      throw new Error(message);
    }

    const data = unwrapApiData<GameApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al actualizar el juego.");
    }
    return data;
  },

  /** Borrado lógico de un juego (solo ADMIN). */
  async deleteGame(id: string): Promise<void> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere autenticación como administrador.");
    }

    const res = await fetch(`${API_BASE_URL}/games/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 404) {
      // Ya fue desactivado por otro proceso; se considera completado
      return;
    }

    if (res.status === 401) {
      throw new Error(
        "Tu sesión ha caducado o el token es antiguo. Por favor, vuelve a iniciar sesión con tu cuenta de administrador.",
      );
    }

    if (res.status === 403) {
      throw new Error("Permisos insuficientes: solo un administrador puede eliminar juegos.");
    }

    if (!res.ok) {
      const rawJson: unknown = await res.json().catch(() => null);
      let message = "No se pudo eliminar el juego del servidor.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        message = extractErrorMessage(rawJson, message);
      }
      throw new Error(message);
    }
  },
};
