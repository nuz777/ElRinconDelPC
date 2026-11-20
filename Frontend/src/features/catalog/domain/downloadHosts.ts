/** Sitios donde se alojan los archivos (detrás del enlace de exe.io). Debe coincidir con la API. */
export const DOWNLOAD_HOST_IDS = [
  "mediafire",
  "mega",
  "gdrive",
  "gofile",
  "buzzheavier",
  "pixeldrain",
  "workupload",
  "1fichier",
  "marketcat",
  "romsfun",
  "official",
  "other",
] as const;

export type DownloadHostId = (typeof DOWNLOAD_HOST_IDS)[number];

export interface DownloadHostInfo {
  id: DownloadHostId;
  label: string;
  /** Color distintivo del sitio (hex). */
  color: string;
  /** Logo en /public/hosts. Sin logo se usa un ícono genérico. */
  logo?: string;
}

export const DOWNLOAD_HOSTS: Record<DownloadHostId, DownloadHostInfo> = {
  mediafire: { id: "mediafire", label: "MediaFire", color: "#1299F3", logo: "/hosts/mediafire.png" },
  mega: { id: "mega", label: "MEGA", color: "#D9272E", logo: "/hosts/mega.png" },
  gdrive: { id: "gdrive", label: "Google Drive", color: "#1FA463", logo: "/hosts/gdrive.svg" },
  gofile: { id: "gofile", label: "Gofile", color: "#3B82F6", logo: "/hosts/gofile.png" },
  buzzheavier: { id: "buzzheavier", label: "Buzzheavier", color: "#F26522", logo: "/hosts/buzzheavier.png" },
  pixeldrain: { id: "pixeldrain", label: "Pixeldrain", color: "#14B8A6", logo: "/hosts/pixeldrain.png" },
  workupload: { id: "workupload", label: "Workupload", color: "#1D6FE0", logo: "/hosts/workupload.png" },
  "1fichier": { id: "1fichier", label: "1fichier", color: "#E8731A", logo: "/hosts/1fichier.png" },
  marketcat: { id: "marketcat", label: "MarketCat Drive", color: "#6366F1", logo: "/hosts/marketcat.png" },
  romsfun: { id: "romsfun", label: "RomsFun", color: "#E11D48", logo: "/hosts/romsfun.png" },
  official: { id: "official", label: "Sitio oficial", color: "#10B981" },
  other: { id: "other", label: "Otro sitio", color: "#71717A" },
};

export const MAX_DOWNLOAD_PARTS = 100;

export function isDownloadHostId(value: unknown): value is DownloadHostId {
  return typeof value === "string" && (DOWNLOAD_HOST_IDS as readonly string[]).includes(value);
}

/** Limpia lo que venga de la API: ids desconocidos se descartan. */
export function normalizeDownloadHosts(value: unknown): DownloadHostId[] | null {
  if (!Array.isArray(value)) return null;
  const hosts = value.filter(isDownloadHostId).slice(0, MAX_DOWNLOAD_PARTS);
  return hosts.length ? hosts : null;
}

export type DownloadHostSummary =
  | { kind: "single"; host: DownloadHostId }
  | { kind: "same"; host: DownloadHostId; parts: number }
  | { kind: "mixed"; parts: DownloadHostId[] };

/** 1 parte → "Alojado en Y"; todas en el mismo sitio → "X partes en Y"; si no, "Parte X en Y". */
export function summarizeDownloadHosts(hosts: DownloadHostId[] | null | undefined): DownloadHostSummary | null {
  if (!hosts || hosts.length === 0) return null;
  if (hosts.length === 1) return { kind: "single", host: hosts[0] };
  if (hosts.every((h) => h === hosts[0])) return { kind: "same", host: hosts[0], parts: hosts.length };
  return { kind: "mixed", parts: hosts };
}
