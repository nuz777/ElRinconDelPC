import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogService, mapApiItemToCatalogItem } from "./catalog.service";
import { API_BASE_URL } from "../../../shared/config/env";

describe("catalog.service", () => {
  afterEach(() => {
    catalogService.clearRecentCache();
    vi.restoreAllMocks();
  });

  it("solicita GET /catalog con view=summary y paginación por defecto", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: "uuid-1",
                section: "JUEGOS",
                title: "Half-Life 2",
                genre: "Acción / Shooter",
                size: "4.5 GB",
                version: "v1.0",
                badge: "Clásico",
                coverUrl: "/catalog/uuid-1/media/cover?v=1",
                downloadUrl: "https://example.com/hl2",
                developer: "Valve",
                shortDescription: "Clásico FPS de ciencia ficción.",
                publicCode: "hl2001",
                createdAt: "2026-01-10T00:00:00.000Z",
              },
            ],
            total: 1,
            page: 1,
            limit: 24,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const page = await catalogService.getPaginatedItems({
      section: "JUEGOS",
      view: "summary",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain(`${API_BASE_URL}/catalog?`);
    expect(requestedUrl).toContain("section=JUEGOS");
    expect(requestedUrl).toContain("limit=24");
    expect(requestedUrl).toContain("view=summary");

    expect(page.total).toBe(1);
    expect(page.items[0].img).toBe(`${API_BASE_URL}/catalog/uuid-1/media/cover?v=1`);
    expect(page.items[0].apartado).toBe("juegos");
  });

  it("omite requisitos del sistema cuando el apartado es adultos", () => {
    const mapped = mapApiItemToCatalogItem({
      id: "uuid-2",
      section: "ADULTOS",
      title: "Visual Novel Test",
      genre: "Novela Visual",
      size: "1 GB",
      version: "v1.0",
      badge: "Disponible",
      coverUrl: null,
      bannerUrl: null,
      downloadUrl: null,
      developer: null,
      shortDescription: "Descripción de prueba.",
      minimumRequirements: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(mapped.apartado).toBe("adultos");
    expect(mapped.requirements).toBeUndefined();
    expect(mapped.img).toBe("/img/indicado.webp");
  });

  it("devuelve null en getItemByCode cuando el servidor responde 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }),
    );

    await expect(catalogService.getItemByCode("missing")).resolves.toBeNull();
  });

  it("precarga juegos recientes una sola vez y expone la página cacheada", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: "uuid-99",
                section: "JUEGOS",
                title: "Elden Ring",
                genre: "RPG",
                size: "60 GB",
                version: "v1.12",
                badge: "Nuevo",
                coverUrl: null,
                downloadUrl: "https://example.com/elden",
                developer: "FromSoftware",
                shortDescription: "ARPG de mundo abierto.",
                publicCode: "er2026",
                createdAt: "2026-06-01T00:00:00.000Z",
              },
            ],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    expect(catalogService.getCachedRecentPage("JUEGOS", 12)).toBeNull();

    const [first, second] = await Promise.all([
      catalogService.prefetchRecentPage("JUEGOS", 12),
      catalogService.prefetchRecentPage("JUEGOS", 12),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.items[0].title).toBe("Elden Ring");
    expect(second.items[0].title).toBe("Elden Ring");

    const cached = catalogService.getCachedRecentPage("JUEGOS", 12);
    expect(cached?.items).toHaveLength(1);

    catalogService.clearRecentCache();
    expect(catalogService.getCachedRecentPage("JUEGOS", 12)).toBeNull();
  });
});
