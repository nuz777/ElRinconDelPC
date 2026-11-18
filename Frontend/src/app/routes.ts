export const ROUTES = {
  HOME: "/",
  CATALOG: "/catalogo",
  GAMES: "/juegos",
  MODS: "/mods-shaders",
  TOOLS: "/herramientas",
  ADULT: "/adultos",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN_CREATE_GAME: "/admin/juegos/nuevo",
} as const;

const CATALOG_PREFIXES = [
  "/catalogo",
  "/sotano",
  "/juegos",
  "/juego/",
  "/mods-shaders",
  "/mod-shader/",
  "/herramientas",
  "/herramienta/",
  "/adultos",
  "/adulto/",
  "/rom/",
  "/publish",
  "/dashboard/crear",
];

export function isCatalogPath(pathname: string): boolean {
  return CATALOG_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix,
  );
}
