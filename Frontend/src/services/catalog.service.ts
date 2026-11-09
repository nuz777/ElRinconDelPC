import { authService } from "./auth.service";
import type { Apartado, CatalogItem } from "../data/catalog";

export type CatalogSectionApi = "JUEGOS" | "MODS" | "HERRAMIENTAS";

export interface CatalogMinimumRequirementsPayload {
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
}

export interface CreateCatalogItemPayload {
  section: CatalogSectionApi;
  title: string;
  genre: string;
  size?: string;
  version?: string;
  badge?: string;
  coverUrl?: string;
  bannerUrl?: string;
  downloadUrl?: string;
  developer?: string;
  shortDescription: string;
  minimumRequirements?: CatalogMinimumRequirementsPayload;
}

export interface CatalogItemApiResponse {
  id: string;
  section: CatalogSectionApi;
  title: string;
  genre: string;
  size: string | null;
  version: string;
  badge: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  downloadUrl: string | null;
  developer: string | null;
  shortDescription: string;
  minimumRequirements: CatalogMinimumRequirementsPayload | null;
  publicCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCatalogResponse {
  items: CatalogItemApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CatalogFilterParams {
  section?: CatalogSectionApi;
  genre?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data) {
    return record.data as T;
  }
  return payload as T;
}

function mapSectionToApartado(section: CatalogSectionApi): Apartado {
  switch (section) {
    case "JUEGOS":
      return "juegos";
    case "MODS":
      return "mods";
    case "HERRAMIENTAS":
      return "herramientas";
    default:
      return "juegos";
  }
}

export function mapApartadoToSection(apartado: Apartado): CatalogSectionApi {
  switch (apartado) {
    case "juegos":
      return "JUEGOS";
    case "mods":
      return "MODS";
    case "herramientas":
      return "HERRAMIENTAS";
    default:
      return "JUEGOS";
  }
}

export function mapApiItemToCatalogItem(api: CatalogItemApiResponse): CatalogItem {
  const apartado = mapSectionToApartado(api.section);
  const downloadUrl = api.downloadUrl || "#";

  return {
    id: api.id,
    publicCode: api.publicCode ?? null,
    title: api.title,
    apartado,
    genre: api.genre,
    tag: api.badge || "Disponible",
    version: api.version || "v1.0",
    size: api.size || "N/A",
    releaseDate: api.createdAt ? new Date(api.createdAt).getFullYear().toString() : "2026",
    developer: api.developer || "Comunidad El Sótano",
    img: api.coverUrl || "/img/indicado.webp",
    bannerImg: api.bannerUrl || undefined,
    shortDesc: api.shortDescription,
    fullDesc: `${api.shortDescription} Publicado oficialmente en la biblioteca de El Sótano del PC.`,
    features: [
      "Verificado y probado en Windows 10 y 11",
      "Descarga directa de alta velocidad",
      "Sin software malicioso ni añadidos innecesarios",
    ],
    requirements: {
      os: api.minimumRequirements?.os || "Windows 10 / 11 64-bit",
      cpu: api.minimumRequirements?.cpu || "Procesador de 2 o 4 núcleos",
      ram: api.minimumRequirements?.ram || "4 GB RAM",
      gpu: api.minimumRequirements?.gpu || "GPU compatible con DirectX 11",
      storage: api.minimumRequirements?.storage || api.size || "1 GB libre",
    },
    downloadLinks: [
      {
        name: "Descarga Directa",
        type: "direct",
        url: downloadUrl,
        server: "Servidor Principal",
        badge: "Directo",
      },
    ],
    installationSteps: [
      "Haz clic en el botón de Descarga Directa.",
      "Descomprime el archivo usando 7-Zip o WinRAR.",
      "Ejecuta el archivo principal como Administrador.",
    ],
  };
}

async function fetchSingleItem(url: string): Promise<CatalogItem | null> {
  const res = await fetch(url);
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) {
    throw new Error("No se pudo obtener el ítem del catálogo.");
  }
  const rawJson: unknown = await res.json().catch(() => null);
  const data = unwrapApiData<CatalogItemApiResponse>(rawJson);
  return data ? mapApiItemToCatalogItem(data) : null;
}

export const catalogService = {
  async getItems(filters: CatalogFilterParams = {}): Promise<CatalogItem[]> {
    const params = new URLSearchParams();
    if (filters.section) params.set("section", filters.section);
    if (filters.genre && filters.genre !== "todos") params.set("genre", filters.genre);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", filters.page.toString());
    params.set("limit", (filters.limit ?? 100).toString());

    const res = await fetch(`${API_BASE_URL}/catalog?${params.toString()}`);
    if (!res.ok) {
      throw new Error("No se pudo obtener el catálogo desde el servidor.");
    }

    const rawJson: unknown = await res.json().catch(() => null);
    const data = unwrapApiData<PaginatedCatalogResponse>(rawJson);
    const items = data?.items ?? [];
    return items.map(mapApiItemToCatalogItem);
  },

  /** Detalle por código público (el de la URL compartible). Devuelve null si no existe. */
  async getItemByCode(code: string): Promise<CatalogItem | null> {
    return fetchSingleItem(`${API_BASE_URL}/catalog/code/${encodeURIComponent(code)}`);
  },

  /** Detalle por UUID (usado para redirigir las URLs antiguas /juegos/:id). */
  async getItemById(id: string): Promise<CatalogItem | null> {
    return fetchSingleItem(`${API_BASE_URL}/catalog/${encodeURIComponent(id)}`);
  },

  async createItem(payload: CreateCatalogItemPayload): Promise<CatalogItem> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere iniciar sesión como administrador.");
    }

    const token = authService.getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/catalog`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const rawJson: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      let message = "Error al guardar el ítem en la base de datos.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        const msg = (rawJson as { message: unknown }).message;
        message = Array.isArray(msg) ? msg.join(", ") : String(msg);
      }
      throw new Error(message);
    }

    const data = unwrapApiData<CatalogItemApiResponse>(rawJson);
    if (!data) {
      throw new Error("Respuesta inválida del servidor al crear el ítem.");
    }

    return mapApiItemToCatalogItem(data);
  },

  async deleteItem(id: string): Promise<void> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere autenticación como administrador.");
    }

    const token = authService.getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/catalog/${id}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (res.status === 404) {
      // Si ya fue borrado en el servidor por otro proceso, se considera completado
      return;
    }

    if (res.status === 401) {
      throw new Error(
        "Tu sesión ha caducado o el token es antiguo. Por favor, vuelve a iniciar sesión con tu cuenta de administrador.",
      );
    }

    if (res.status === 403) {
      throw new Error("Permisos insuficientes: solo un administrador puede eliminar elementos.");
    }

    if (!res.ok) {
      const rawJson: unknown = await res.json().catch(() => null);
      let message = "No se pudo eliminar el ítem del catálogo.";
      if (rawJson && typeof rawJson === "object" && "message" in rawJson) {
        const msg = (rawJson as { message: unknown }).message;
        message = Array.isArray(msg) ? msg.join(", ") : String(msg);
      }
      throw new Error(message);
    }
  },
};
