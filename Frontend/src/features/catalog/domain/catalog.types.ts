export type Apartado = "juegos" | "mods" | "herramientas" | "roms" | "adultos";

export interface DownloadLink {
  name: string;
  type: "direct" | "torrent" | "mirror";
  url: string;
  badge?: string;
  server: string;
}

/** Encuadre de la portada dentro de la card: posición en % (0-100) y zoom (1-3). */
export interface CoverFraming {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_COVER_FRAMING: CoverFraming = { x: 50, y: 50, scale: 1 };

export interface CatalogItem {
  id: string;
  /** Código público fijo (6 caracteres) usado en la URL compartible. */
  publicCode?: string | null;
  /** Solo ROMs: marca de la consola (Nintendo, Sega...). */
  brand?: string | null;
  /** Solo ROMs: consola a la que pertenece la ROM. */
  console?: string | null;
  /** Solo ROMs: emulador recomendado. */
  emulator?: string | null;
  title: string;
  apartado: Apartado;
  genre: string;
  tag: string;
  version: string;
  size: string;
  releaseDate: string;
  developer: string;
  img: string; // Portada vertical
  /** Encuadre de la portada (null = centrada, sin zoom). */
  coverFraming?: CoverFraming | null;
  bannerImg?: string; // Banner horizontal de cabecera
  /** Encuadre del banner de cabecera (null = centrado, sin zoom). */
  bannerFraming?: CoverFraming | null;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  requirements?: {
    os: string;
    cpu: string;
    ram: string;
    gpu: string;
    storage: string;
  };
  downloadLinks: DownloadLink[];
  installationSteps: string[];
}
