import type { Apartado, CatalogItem } from "../domain/catalog.types";

export type LibrarySectionFilter = "todos" | Apartado;
export type LibrarySortMode = "recent" | "title" | "size";

export interface LibraryFilterOptions {
  search: string;
  section: LibrarySectionFilter;
  sort: LibrarySortMode;
}

export interface LibraryStats {
  total: number;
  totalSizeLabel: string;
  byApartado: Record<Apartado, number>;
}

const SIZE_REGEX = /(\d+(?:[.,]\d+)?)\s*(tb|gb|mb|kb)/i;

/** Convierte una etiqueta de tamaño (ej. "14.5 GB", "850 MB") a MB para ordenar y sumar. */
export function parseSizeInMb(sizeStr?: string | null): number {
  if (!sizeStr) return 0;
  const match = SIZE_REGEX.exec(sizeStr);
  if (!match) return 0;
  const value = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return 0;

  switch (match[2].toLowerCase()) {
    case "tb":
      return value * 1024 * 1024;
    case "gb":
      return value * 1024;
    case "mb":
      return value;
    case "kb":
      return value / 1024;
    default:
      return 0;
  }
}

export function formatTotalSizeMb(totalMb: number): string {
  if (totalMb <= 0) return "—";
  if (totalMb >= 1024 * 1024) {
    return `${(totalMb / (1024 * 1024)).toFixed(1)} TB`;
  }
  if (totalMb >= 1024) {
    return `${(totalMb / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(totalMb)} MB`;
}

export function filterLibraryItems(
  items: CatalogItem[],
  options: LibraryFilterOptions,
): CatalogItem[] {
  const query = options.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (options.section !== "todos" && item.apartado !== options.section) {
      return false;
    }
    if (!query) return true;

    return (
      item.title.toLowerCase().includes(query) ||
      item.genre.toLowerCase().includes(query) ||
      item.developer.toLowerCase().includes(query) ||
      item.tag.toLowerCase().includes(query) ||
      (item.console?.toLowerCase().includes(query) ?? false) ||
      (item.brand?.toLowerCase().includes(query) ?? false)
    );
  });

  if (options.sort === "recent") {
    return filtered;
  }

  return [...filtered].sort((a, b) => {
    if (options.sort === "title") {
      return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
    }
    return parseSizeInMb(b.size) - parseSizeInMb(a.size);
  });
}

export function computeLibraryStats(items: CatalogItem[]): LibraryStats {
  const byApartado: Record<Apartado, number> = {
    juegos: 0,
    mods: 0,
    herramientas: 0,
    roms: 0,
    adultos: 0,
  };

  let totalMb = 0;
  for (const item of items) {
    byApartado[item.apartado] = (byApartado[item.apartado] ?? 0) + 1;
    totalMb += parseSizeInMb(item.size);
  }

  return {
    total: items.length,
    totalSizeLabel: formatTotalSizeMb(totalMb),
    byApartado,
  };
}
