import type { Apartado, CatalogItem } from "../data/catalog";

/** Prefijo de la URL de detalle según el apartado del catálogo. */
export const APARTADO_ROUTE_PREFIX: Record<Apartado, string> = {
  juegos: "juego",
  mods: "mod-shader",
  herramientas: "herramienta",
};

/** Coincide con /juego/{slug}-{codigo}, /mod-shader/... y /herramienta/... */
const DETAIL_PATH_REGEX = /^\/(juego|mod-shader|herramienta)\/([^/?#]+)\/?$/;
const PUBLIC_CODE_SUFFIX_REGEX = /(?:^|-)([a-z0-9]{6})$/;

/** Convierte un título en un slug URL-friendly (misma regla que el backend). */
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
  const decoded = decodeURIComponent(slugAndCode).toLowerCase();
  return decoded.match(PUBLIC_CODE_SUFFIX_REGEX)?.[1] ?? null;
}

/** Segmento `{slug}-{codigo}` de un ítem, o null si aún no tiene código público. */
export function buildItemSlugCode(item: Pick<CatalogItem, "title" | "publicCode">): string | null {
  if (!item.publicCode) return null;
  const slug = slugify(item.title);
  return slug ? `${slug}-${item.publicCode}` : item.publicCode;
}

/** URL compartible del detalle: /juego/gta-san-andreas-a3f9k2 */
export function buildItemPath(
  item: Pick<CatalogItem, "title" | "publicCode" | "apartado">,
): string | null {
  const slugCode = buildItemSlugCode(item);
  if (!slugCode) return null;
  return `/${APARTADO_ROUTE_PREFIX[item.apartado]}/${slugCode}`;
}

/** Si la ruta actual es la de un detalle, devuelve el código público que contiene. */
export function parseDetailPath(pathname: string): { code: string | null } | null {
  const match = pathname.match(DETAIL_PATH_REGEX);
  if (!match) return null;
  return { code: extractPublicCode(match[2]) };
}
