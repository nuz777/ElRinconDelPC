import { describe, expect, it } from "vitest";
import type { CatalogItem } from "../domain/catalog.types";
import {
  computeLibraryStats,
  filterLibraryItems,
  formatTotalSizeMb,
  parseSizeInMb,
} from "./libraryHelpers";

function makeItem(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: "id-1",
    title: "Hollow Knight",
    apartado: "juegos",
    genre: "Metroidvania",
    tag: "Indie",
    version: "v1.5",
    size: "9 GB",
    releaseDate: "2017",
    developer: "Team Cherry",
    img: "/img/indicado.webp",
    shortDesc: "Metroidvania.",
    fullDesc: "Metroidvania completo.",
    features: [],
    downloadLinks: [],
    installationSteps: [],
    ...overrides,
  };
}

describe("libraryHelpers", () => {
  it("parsea y formatea tamaños en KB, MB, GB y TB", () => {
    expect(parseSizeInMb("14.5 GB")).toBeCloseTo(14848);
    expect(parseSizeInMb("850 MB")).toBe(850);
    expect(parseSizeInMb("512 KB")).toBe(0.5);
    expect(parseSizeInMb("1.5 TB")).toBe(1.5 * 1024 * 1024);
    expect(parseSizeInMb("Desconocido")).toBe(0);

    expect(formatTotalSizeMb(0)).toBe("—");
    expect(formatTotalSizeMb(512)).toBe("512 MB");
    expect(formatTotalSizeMb(15360)).toBe("15.0 GB");
  });

  it("filtra por apartado, búsqueda y ordena por título o tamaño", () => {
    const items: CatalogItem[] = [
      makeItem({ id: "1", title: "Zelda", apartado: "roms", console: "Switch", size: "12 GB" }),
      makeItem({ id: "2", title: "Celeste", apartado: "juegos", developer: "EXOK", size: "1.2 GB" }),
      makeItem({ id: "3", title: "Alpha Shader", apartado: "mods", size: "300 MB" }),
    ];

    expect(
      filterLibraryItems(items, { search: "switch", section: "todos", sort: "recent" }).map((i) => i.id),
    ).toEqual(["1"]);

    expect(
      filterLibraryItems(items, { search: "", section: "juegos", sort: "recent" }).map((i) => i.id),
    ).toEqual(["2"]);

    expect(
      filterLibraryItems(items, { search: "", section: "todos", sort: "title" }).map((i) => i.title),
    ).toEqual(["Alpha Shader", "Celeste", "Zelda"]);

    expect(
      filterLibraryItems(items, { search: "", section: "todos", sort: "size" }).map((i) => i.title),
    ).toEqual(["Zelda", "Celeste", "Alpha Shader"]);
  });

  it("calcula estadísticas totales de la biblioteca", () => {
    const stats = computeLibraryStats([
      makeItem({ id: "1", apartado: "juegos", size: "10 GB" }),
      makeItem({ id: "2", apartado: "mods", size: "512 MB" }),
      makeItem({ id: "3", apartado: "juegos", size: "2 GB" }),
    ]);

    expect(stats.total).toBe(3);
    expect(stats.byApartado.juegos).toBe(2);
    expect(stats.byApartado.mods).toBe(1);
    expect(stats.totalSizeLabel).toBe("12.5 GB");
  });
});
