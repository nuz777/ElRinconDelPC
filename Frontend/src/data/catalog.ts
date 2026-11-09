export type Apartado = "juegos" | "mods" | "herramientas";

export interface DownloadLink {
  name: string;
  type: "direct" | "torrent" | "mirror";
  url: string;
  badge?: string;
  server: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  apartado: Apartado;
  genre: string;
  tag: string;
  version: string;
  size: string;
  releaseDate: string;
  developer: string;
  img: string; // Portada vertical
  bannerImg?: string; // Banner horizontal de cabecera
  shortDesc: string;
  fullDesc: string;
  features: string[];
  requirements: {
    os: string;
    cpu: string;
    ram: string;
    gpu: string;
    storage: string;
  };
  downloadLinks: DownloadLink[];
  installationSteps: string[];
}

export const initialCatalogItems: CatalogItem[] = [];
