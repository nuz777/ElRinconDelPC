import { authService } from "./auth.service";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface ModApiResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  version: string;
  downloadUrl: string;
  fileSize: string | null;
  thumbnailUrl: string | null;
  gameId: string;
  authorId: string;
  authorEmail?: string;
  downloadsCount: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedModsResponse {
  items: ModApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateModPayload {
  title: string;
  description: string;
  version: string;
  downloadUrl: string;
  gameId: string;
  thumbnailUrl?: string | null;
  fileSize?: string | null;
  minimumRequirements: {
    os: string;
    storage: string;
    ram: string;
    cpu: string;
    gpu: string;
  };
}

export interface ModFilterParams {
  search?: string;
  page?: number;
  limit?: number;
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

export const modsService = {
  /** Listar mods de un juego (activos y aprobados). */
  async getModsByGame(
    gameId: string,
    filters: ModFilterParams = {},
  ): Promise<PaginatedModsResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await fetch(
      `${API_BASE_URL}/games/${encodeURIComponent(gameId)}/mods?${params.toString()}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      throw new Error("No se pudieron obtener los mods del juego.");
    }

    const rawJson: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<PaginatedModsResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al obtener mods.");
    }
    return data;
  },

  /** Detalle de un mod por ID. */
  async getModById(id: string): Promise<ModApiResponse> {
    const res = await fetch(`${API_BASE_URL}/mods/${encodeURIComponent(id)}`, {
      credentials: "include",
    });
    if (res.status === 404) {
      throw new Error("Mod no encontrado.");
    }
    if (!res.ok) {
      throw new Error("No se pudo obtener el detalle del mod.");
    }

    const rawJson: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<ModApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al obtener el mod.");
    }
    return data;
  },

  /** Incrementar contador de descargas y obtener URL de descarga. */
  async downloadMod(id: string): Promise<{ downloadUrl: string }> {
    const res = await fetch(`${API_BASE_URL}/mods/${encodeURIComponent(id)}/download`, {
      method: "POST",
      credentials: "include",
    });
    if (res.status === 404) {
      throw new Error("Mod no encontrado.");
    }
    if (!res.ok) {
      throw new Error("No se pudo procesar la descarga.");
    }
    const rawJson: unknown = await res.json().catch(() => null);
    return unwrapApiData<{ downloadUrl: string }>(rawJson) ?? { downloadUrl: "" };
  },

  /** Crear un nuevo mod (requiere autenticación). */
  async createMod(payload: CreateModPayload): Promise<ModApiResponse> {
    if (!authService.getStoredUser()) {
      throw new Error("Se requiere iniciar sesión para publicar un mod.");
    }

    const token = authService.getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/mods`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const rawJson: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      let message = "Error al publicar el mod en el servidor.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        message = extractErrorMessage(rawJson, message);
      }
      throw new Error(message);
    }

    const data = unwrapApiData<ModApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al crear el mod.");
    }
    return data;
  },
};
