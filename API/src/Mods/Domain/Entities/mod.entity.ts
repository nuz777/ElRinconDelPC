export interface MinimumRequirements {
  os: string;
  storage: string;
  ram: string;
  cpu: string;
  gpu: string;
}

export interface ModProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  version: string;
  downloadUrl: string;
  fileSize?: string | null;
  thumbnailUrl?: string | null;
  gameId?: string | null;
  authorId: string;
  downloadsCount?: number;
  isApproved?: boolean;
  isActive?: boolean;
  minimumRequirements?: MinimumRequirements;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad de dominio pura (sin dependencias de framework/ORM) que representa
 * un mod publicado para un juego.
 */
export class Mod {
  public readonly id: string;
  public title: string;
  public slug: string;
  public description: string;
  public version: string;
  public downloadUrl: string;
  public fileSize: string | null;
  public thumbnailUrl: string | null;
  public gameId: string | null;
  public authorId: string;
  public downloadsCount: number;
  public isApproved: boolean;
  public isActive: boolean;
  public minimumRequirements: MinimumRequirements;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ModProps) {
    this.id = props.id;
    this.title = props.title.trim();
    this.slug = props.slug.toLowerCase().trim();
    this.description = props.description.trim();
    this.version = props.version.trim();
    this.downloadUrl = props.downloadUrl.trim();
    this.fileSize = props.fileSize ?? null;
    this.thumbnailUrl = props.thumbnailUrl ?? null;
    this.gameId = props.gameId ? props.gameId.trim() : null;
    this.authorId = props.authorId.trim();
    this.downloadsCount = props.downloadsCount ?? 0;
    this.isApproved = props.isApproved ?? false;
    this.isActive = props.isActive ?? true;
    this.minimumRequirements = props.minimumRequirements ?? {
      os: '',
      storage: '',
      ram: '',
      cpu: '',
      gpu: '',
    };
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  isOwnedBy(userId: string): boolean {
    return this.authorId === userId;
  }

  canBeModifiedBy(userId: string, userRole: string): boolean {
    return this.isOwnedBy(userId) || userRole === 'admin';
  }

  approve(): void {
    this.isApproved = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  incrementDownloads(): void {
    this.downloadsCount += 1;
  }
}
