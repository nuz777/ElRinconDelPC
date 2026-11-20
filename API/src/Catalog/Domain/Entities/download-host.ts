/**
 * Sitios donde se alojan los archivos que hay detrás de cada enlace de exe.io.
 * `downloadHosts` guarda un id por cada parte del juego (en orden).
 */
export const CATALOG_DOWNLOAD_HOSTS = [
  'mediafire',
  'mega',
  'gdrive',
  'gofile',
  'buzzheavier',
  'pixeldrain',
  'workupload',
  '1fichier',
  'marketcat',
  'romsfun',
  'official',
  'other',
] as const;

export type CatalogDownloadHost = (typeof CATALOG_DOWNLOAD_HOSTS)[number];

/** Máximo de partes que se pueden registrar para un ítem. */
export const MAX_DOWNLOAD_PARTS = 100;
