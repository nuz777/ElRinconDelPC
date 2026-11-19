import {
  ApiError,
  requestJson,
  resolveApiMediaUrl,
} from "../../../shared/api/httpClient";
import { cleanDescription } from "../../../shared/utils/cleanDescription";
import { authService } from "../../auth/services/auth.service";
import type { Apartado, CatalogItem, CoverFraming } from "../domain/catalog.types";
import { NO_STABLE_EMULATOR } from "../domain/romPlatforms";

export type CatalogSectionApi = "JUEGOS" | "MODS" | "HERRAMIENTAS" | "ROMS" | "ADULTOS";

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
  coverFraming?: CoverFraming | null;
  bannerUrl?: string;
  downloadUrl?: string;
  developer?: string;
  shortDescription: string;
  minimumRequirements?: CatalogMinimumRequirementsPayload;
  /** Solo ROMs */
  brand?: string;
  console?: string;
  emulator?: string;
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
  coverFraming?: CoverFraming | null;
  bannerUrl?: string | null;
  downloadUrl: string | null;
  developer: string | null;
  shortDescription: string;
  minimumRequirements?: CatalogMinimumRequirementsPayload | null;
  publicCode?: string | null;
  brand?: string | null;
  console?: string | null;
  emulator?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedCatalogResponse {
  items: CatalogItemApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CatalogPageResult {
  items: CatalogItem[];
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
  view?: "full" | "summary";
}

function mapSectionToApartado(section: CatalogSectionApi): Apartado {
  switch (section) {
    case "JUEGOS":
      return "juegos";
    case "MODS":
      return "mods";
    case "HERRAMIENTAS":
      return "herramientas";
    case "ROMS":
      return "roms";
    case "ADULTOS":
      return "adultos";
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
    case "roms":
      return "ROMS";
    case "adultos":
      return "ADULTOS";
    default:
      return "JUEGOS";
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = authService.getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function mapApiItemToCatalogItem(api: CatalogItemApiResponse): CatalogItem {
  const apartado = mapSectionToApartado(api.section);
  const downloadUrl = api.downloadUrl || "#";
  const isRom = apartado === "roms";
  const isAdult = apartado === "adultos";
  const emulator = api.emulator || null;

  return {
    id: api.id,
    publicCode: api.publicCode ?? null,
    brand: api.brand ?? null,
    console: api.console ?? null,
    emulator,
    title: api.title,
    apartado,
    genre: api.genre,
    tag: api.badge || "Disponible",
    version: api.version || "v1.0",
    size: api.size || "N/A",
    releaseDate: api.createdAt ? new Date(api.createdAt).getFullYear().toString() : "2026",
    developer: api.developer || "Comunidad El Sótano",
    img: resolveApiMediaUrl(api.coverUrl, "/img/indicado.webp") || "/img/indicado.webp",
    coverFraming: api.coverFraming ?? null,
    bannerImg: resolveApiMediaUrl(api.bannerUrl),
    shortDesc: cleanDescription(api.shortDescription),
    fullDesc: cleanDescription(api.shortDescription),
    features: isRom
      ? [
          `ROM de ${api.console ?? "consola"} (${api.brand ?? "—"})`,
          emulator ? `Probada con ${emulator}` : "Compatible con los emuladores más usados",
          "Descarga directa de alta velocidad",
        ]
      : [
          "Verificado y probado en Windows 10 y 11",
          "Descarga directa de alta velocidad",
          "Sin software malicioso ni añadidos innecesarios",
        ],
    requirements: isAdult
      ? undefined
      : {
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
    installationSteps: isRom
      ? [
          "Descarga la ROM con el botón de Descarga Directa.",
          emulator && emulator !== NO_STABLE_EMULATOR
            ? `Instala el emulador recomendado: ${emulator}.`
            : `Instala un emulador compatible con ${api.console ?? "la consola"}.`,
          "Descomprime la ROM si viene comprimida y ábrela desde el emulador.",
        ]
      : [
          "Haz clic en el botón de Descarga Directa.",
          "Descomprime el archivo usando 7-Zip o WinRAR.",
          "Ejecuta el archivo principal como Administrador.",
        ],
  };
}

async function fetchSingleItem(path: string): Promise<CatalogItem | null> {
  try {
    const data = await requestJson<CatalogItemApiResponse>(path, {
      fallbackError: "No se pudo obtener el ítem del catálogo.",
    });
    return data ? mapApiItemToCatalogItem(data) : null;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}

const RECENT_CACHE_TTL_MS = 60_000;
const recentCache = new Map<string, { data: CatalogPageResult; expiresAt: number }>();
const recentInFlight = new Map<string, Promise<CatalogPageResult>>();

function recentCacheKey(section: CatalogSectionApi, limit: number): string {
  return `${section}:${limit}`;
}

export const catalogService = {
  getCachedRecentPage(
    section: CatalogSectionApi = "JUEGOS",
    limit = 12,
  ): CatalogPageResult | null {
    const key = recentCacheKey(section, limit);
    const entry = recentCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      recentCache.delete(key);
      return null;
    }
    return entry.data;
  },

  clearRecentCache(): void {
    recentCache.clear();
    recentInFlight.clear();
  },

  async prefetchRecentPage(
    section: CatalogSectionApi = "JUEGOS",
    limit = 12,
  ): Promise<CatalogPageResult> {
    const cached = this.getCachedRecentPage(section, limit);
    if (cached) return cached;

    const key = recentCacheKey(section, limit);
    const active = recentInFlight.get(key);
    if (active) return active;

    const promise = this.getPaginatedItems({
      section,
      page: 1,
      limit,
      view: "summary",
    })
      .then((res) => {
        recentCache.set(key, {
          data: res,
          expiresAt: Date.now() + RECENT_CACHE_TTL_MS,
        });
        return res;
      })
      .finally(() => {
        recentInFlight.delete(key);
      });

    recentInFlight.set(key, promise);
    return promise;
  },

  async getPaginatedItems(filters: CatalogFilterParams = {}): Promise<CatalogPageResult> {
    const params = new URLSearchParams();
    if (filters.section) params.set("section", filters.section);
    if (filters.genre && filters.genre !== "todos") params.set("genre", filters.genre);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    params.set("limit", String(filters.limit ?? 24));
    if (filters.view) params.set("view", filters.view);

    const data = await requestJson<PaginatedCatalogResponse>(`/catalog?${params.toString()}`, {
      fallbackError: "No se pudo obtener el catálogo desde el servidor.",
    });

    const rawItems = data?.items ?? [];
    const limit = data?.limit ?? filters.limit ?? 24;
    const total = data?.total ?? rawItems.length;
    return {
      items: rawItems.map(mapApiItemToCatalogItem),
      total,
      page: data?.page ?? filters.page ?? 1,
      limit,
      totalPages: data?.totalPages ?? Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getItems(filters: CatalogFilterParams = {}): Promise<CatalogItem[]> {
    const page = await this.getPaginatedItems({
      ...filters,
      limit: filters.limit ?? 100,
    });
    return page.items;
  },

  /** Detalle por código público (el de la URL compartible). Devuelve null si no existe. */
  async getItemByCode(code: string): Promise<CatalogItem | null> {
    return fetchSingleItem(`/catalog/code/${encodeURIComponent(code)}`);
  },

  /** Detalle por UUID (usado para redirigir las URLs antiguas /juegos/:id o hidratar detalles). */
  async getItemById(id: string): Promise<CatalogItem | null> {
    return fetchSingleItem(`/catalog/${encodeURIComponent(id)}`);
  },

  async createItem(payload: CreateCatalogItemPayload): Promise<CatalogItem> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere iniciar sesión como administrador.");
    }

    const data = await requestJson<CatalogItemApiResponse>("/catalog", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      fallbackError: "Error al guardar el ítem en la base de datos.",
    });

    if (!data) {
      throw new Error("Respuesta inválida del servidor al crear el ítem.");
    }

    this.clearRecentCache();
    return mapApiItemToCatalogItem(data);
  },

  async updateItem(
    id: string,
    payload: Partial<CreateCatalogItemPayload>,
  ): Promise<CatalogItem> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere iniciar sesión como administrador.");
    }

    const data = await requestJson<CatalogItemApiResponse>(`/catalog/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      fallbackError: "Error al actualizar el ítem en la base de datos.",
    });

    if (!data) {
      throw new Error("Respuesta inválida del servidor al actualizar el ítem.");
    }

    this.clearRecentCache();
    return mapApiItemToCatalogItem(data);
  },

  async deleteItem(id: string): Promise<void> {
    if (!authService.isAdmin()) {
      throw new Error("Se requiere autenticación como administrador.");
    }

    try {
      await requestJson<unknown>(`/catalog/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          ...(authService.getStoredToken()
            ? { Authorization: `Bearer ${authService.getStoredToken()}` }
            : {}),
        },
        fallbackError: "No se pudo eliminar el ítem del catálogo.",
      });
      this.clearRecentCache();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) return;
        if (err.status === 401) {
          throw new Error(
            "Tu sesión ha caducado o el token es antiguo. Por favor, vuelve a iniciar sesión con tu cuenta de administrador.",
            { cause: err },
          );
        }
        if (err.status === 403) {
          throw new Error(
            "Permisos insuficientes: solo un administrador puede eliminar elementos.",
            { cause: err },
          );
        }
      }
      throw err;
    }
  },
};
