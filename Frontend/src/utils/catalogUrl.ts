import type { Apartado, CatalogItem } from "../data/catalog";
import { ROM_BRANDS } from "../data/romPlatforms";

/**
 * Rutas del catálogo:
 *   Listados:  /catalogo · /juegos · /mods-shaders · /herramientas · /adultos · /rom/{marca}/{consola}
 *   Detalle:   /juego/{slug}-{codigo} · /mod-shader/... · /herramienta/... · /adulto/...
 *              /rom/{marca}/{consola}/{slug}-{codigo}
 */

/** Vista de listado del catálogo (lo que se ve detrás del modal). */
export type CatalogView =
  | { apartado: "todos" | "juegos" | "mods" | "herramientas" | "adultos" }
  | { apartado: "roms"; brand: string; console: string };

export interface CatalogRoute {
  /** Listado que corresponde a la ruta (para un detalle: su listado por defecto). */
  view: CatalogView;
  /** Código público si la ruta es de un detalle. */
  detailCode: string | null;
  /** true si la ruta es de un detalle. */
  isDetail: boolean;
}

/** Prefijo de la URL de detalle (apartados que no son ROMs). */
const DETAIL_PREFIX: Record<Exclude<Apartado, "roms">, string> = {
  juegos: "juego",
  mods: "mod-shader",
  herramientas: "herramienta",
  adultos: "adulto",
};

/** URL de listado de cada apartado (ROMs no tiene listado general). */
export const SECTION_PATHS: Record<"todos" | Exclude<Apartado, "roms">, string> = {
  todos: "/catalogo",
  juegos: "/juegos",
  mods: "/mods-shaders",
  herramientas: "/herramientas",
  adultos: "/adultos",
};

const PUBLIC_CODE_SUFFIX_REGEX = /(?:^|-)([a-z0-9]{6})$/;

/** Convierte un texto en un slug URL-friendly (misma regla que el backend). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Extrae el código público (últimos 6 caracteres) de un segmento `{slug}-{codigo}`. */
export function extractPublicCode(slugAndCode: string): string | null {
  let decoded = slugAndCode;
  try {
    decoded = decodeURIComponent(slugAndCode);
  } catch {
    // segmento mal codificado: usarlo tal cual
  }
  return decoded.toLowerCase().match(PUBLIC_CODE_SUFFIX_REGEX)?.[1] ?? null;
}

/** Busca la marca y consola reales a partir de sus slugs de URL. */
export function findRomPlatformBySlugs(
  brandSlug: string,
  consoleSlug: string,
): { brand: string; console: string } | null {
  const brand = ROM_BRANDS.find((b) => slugify(b.name) === brandSlug.toLowerCase());
  const consoleEntry = brand?.consoles.find((co) => slugify(co.name) === consoleSlug.toLowerCase());
  return brand && consoleEntry ? { brand: brand.name, console: consoleEntry.name } : null;
}

/** Listado de ROMs de una consola: /rom/nintendo/nintendo-64 */
export function buildRomListPath(brand: string, consoleName: string): string {
  return `/rom/${slugify(brand)}/${slugify(consoleName)}`;
}

/** URL de una vista de listado. */
export function buildViewPath(view: CatalogView): string {
  return view.apartado === "roms"
    ? buildRomListPath(view.brand, view.console)
    : SECTION_PATHS[view.apartado];
}

/** Segmento `{slug}-{codigo}` de un ítem, o null si aún no tiene código público. */
export function buildItemSlugCode(item: Pick<CatalogItem, "title" | "publicCode">): string | null {
  if (!item.publicCode) return null;
  const slug = slugify(item.title);
  return slug ? `${slug}-${item.publicCode}` : item.publicCode;
}

/** Listado al que pertenece un ítem (para ROMs: el de su consola). */
export function viewForItem(
  item: Pick<CatalogItem, "apartado" | "brand" | "console">,
): CatalogView {
  if (item.apartado === "roms") {
    return item.brand && item.console
      ? { apartado: "roms", brand: item.brand, console: item.console }
      : { apartado: "todos" };
  }
  return { apartado: item.apartado };
}

/** URL compartible del detalle de un ítem. */
export function buildItemPath(
  item: Pick<CatalogItem, "title" | "publicCode" | "apartado" | "brand" | "console">,
): string | null {
  const slugCode = buildItemSlugCode(item);
  if (!slugCode) return null;
  if (item.apartado === "roms") {
    if (!item.brand || !item.console) return null;
    return `${buildRomListPath(item.brand, item.console)}/${slugCode}`;
  }
  return `/${DETAIL_PREFIX[item.apartado]}/${slugCode}`;
}

/**
 * Interpreta una ruta del catálogo. Devuelve null si no es válida
 * (por ejemplo /rom o /rom/{marca} sin consola, o una consola inexistente).
 */
export function parseCatalogRoute(pathname: string): CatalogRoute | null {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const list = (view: CatalogView): CatalogRoute => ({ view, detailCode: null, isDetail: false });
  const detail = (view: CatalogView, segment: string): CatalogRoute => ({
    view,
    detailCode: extractPublicCode(segment),
    isDetail: true,
  });

  if (parts.length === 0) return null;
  const [head, ...rest] = parts;

  if (rest.length === 0) {
    if (head === "catalogo" || head === "sotano") return list({ apartado: "todos" });
    if (head === "juegos") return list({ apartado: "juegos" });
    if (head === "mods-shaders") return list({ apartado: "mods" });
    if (head === "herramientas") return list({ apartado: "herramientas" });
    if (head === "adultos" || head === "+18") return list({ apartado: "adultos" });
    return null;
  }

  if (rest.length === 1) {
    if (head === "juego") return detail({ apartado: "juegos" }, rest[0]);
    if (head === "mod-shader") return detail({ apartado: "mods" }, rest[0]);
    if (head === "herramienta") return detail({ apartado: "herramientas" }, rest[0]);
    if (head === "adulto") return detail({ apartado: "adultos" }, rest[0]);
  }

  if (head === "rom" && (rest.length === 2 || rest.length === 3)) {
    const platform = findRomPlatformBySlugs(rest[0], rest[1]);
    if (!platform) return null;
    const view: CatalogView = { apartado: "roms", ...platform };
    return rest.length === 2 ? list(view) : detail(view, rest[2]);
  }

  return null;
}
