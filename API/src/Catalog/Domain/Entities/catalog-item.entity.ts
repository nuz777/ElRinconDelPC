import type { CatalogSection } from './catalog-section.enum.js';

export const DEFAULT_CATALOG_VERSION = 'v1.0';

export interface CatalogMinimumRequirements {
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
}

export interface CatalogItemProps {
  id: string;
  section: CatalogSection;
  title: string;
  genre: string;
  size?: string | null;
  version?: string | null;
  badge?: string | null;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  downloadUrl?: string | null;
  developer?: string | null;
  shortDescription: string;
  minimumRequirements?: CatalogMinimumRequirements | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad de dominio pura (sin dependencias de framework/ORM) que representa
 * un juego, mod o herramienta publicado en el catálogo.
 */
export class CatalogItem {
  public readonly id: string;
  public section: CatalogSection;
  public title: string;
  public genre: string;
  public size: string | null;
  public version: string;
  public badge: string | null;
  public coverUrl: string | null;
  public bannerUrl: string | null;
  public downloadUrl: string | null;
  public developer: string | null;
  public shortDescription: string;
  public minimumRequirements: CatalogMinimumRequirements | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: CatalogItemProps) {
    this.id = props.id;
    this.section = props.section;
    this.title = props.title;
    this.genre = props.genre;
    this.size = props.size ?? null;
    this.version = props.version ?? DEFAULT_CATALOG_VERSION;
    this.badge = props.badge ?? null;
    this.coverUrl = props.coverUrl ?? null;
    this.bannerUrl = props.bannerUrl ?? null;
    this.downloadUrl = props.downloadUrl ?? null;
    this.developer = props.developer ?? null;
    this.shortDescription = props.shortDescription;
    this.minimumRequirements = props.minimumRequirements ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
