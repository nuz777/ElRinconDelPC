export interface ToolProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  size: string | null;
  downloadUrl: string;
  imageUrl: string | null;
  tags: string[];
  authorId: string;
  downloadsCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad de dominio pura (sin dependencias de framework/ORM) que representa
 * una herramienta publicada en el catálogo.
 */
export class Tool {
  public readonly id: string;
  public title: string;
  public slug: string;
  public description: string;
  public category: string;
  public version: string;
  public size: string | null;
  public downloadUrl: string;
  public imageUrl: string | null;
  public tags: string[];
  public authorId: string;
  public downloadsCount: number;
  public isActive: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ToolProps) {
    this.id = props.id;
    this.title = (props.title ?? '').trim();
    this.slug = (props.slug ?? '').toLowerCase().trim();
    this.description = (props.description ?? '').trim();
    this.category = (props.category ?? 'Utilidades').trim();
    this.version = (props.version ?? 'v1.0').trim();
    this.size = props.size ?? null;
    this.downloadUrl = (props.downloadUrl ?? '').trim();
    this.imageUrl = props.imageUrl ?? null;
    this.tags = props.tags ?? [];
    this.authorId = props.authorId.trim();
    this.downloadsCount = props.downloadsCount ?? 0;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  isOwnedBy(userId: string): boolean {
    return this.authorId === userId;
  }

  canBeModifiedBy(userId: string, userRole: string): boolean {
    return this.isOwnedBy(userId) || userRole === 'admin';
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  incrementDownloads(): void {
    this.downloadsCount += 1;
  }
}
