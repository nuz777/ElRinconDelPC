export interface MinimumRequirements {
  os: string;
  storage: string;
  ram: string;
  cpu: string;
  gpu: string;
}

export interface GameProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  genres: string[];
  coverImage: string;
  bannerImage?: string | null;
  developer: string;
  publisher: string;
  releaseDate?: Date;
  isActive?: boolean;
  minimumRequirements?: MinimumRequirements;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad de dominio pura (sin dependencias de framework/ORM) que representa
 * un juego publicado en la tienda.
 */
export class Game {
  public readonly id: string;
  public title: string;
  public slug: string;
  public description: string;
  public price: number;
  public discountPrice: number | null;
  public stock: number;
  public genres: string[];
  public coverImage: string;
  public bannerImage: string | null;
  public developer: string;
  public publisher: string;
  public releaseDate: Date;
  public isActive: boolean;
  public minimumRequirements: MinimumRequirements;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: GameProps) {
    this.id = props.id;
    this.title = (props.title ?? '').trim();
    this.slug = (props.slug ?? '').toLowerCase().trim();
    this.description = (props.description ?? '').trim();
    this.price = props.price ?? 0;
    this.discountPrice = props.discountPrice ?? null;
    this.stock = props.stock;
    this.genres = props.genres ?? [];
    this.coverImage = props.coverImage ?? '';
    this.bannerImage = props.bannerImage ?? null;
    this.developer = (props.developer ?? '').trim();
    this.publisher = (props.publisher ?? '').trim();
    this.releaseDate = props.releaseDate ?? new Date();
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
}
