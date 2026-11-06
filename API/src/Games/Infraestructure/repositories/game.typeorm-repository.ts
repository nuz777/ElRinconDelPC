import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Game } from '../../Domain/Entities/game.entity.js';
import type {
  CreateGameData,
  GameFilters,
  GameRepository,
  PaginatedResult,
  UpdateGameData,
} from '../../Domain/interfaces/game.repository.interface.js';

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

interface GameRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number | string;
  discount_price: number | string | null;
  stock: number;
  genres: string[];
  cover_image: string;
  banner_image: string | null;
  developer: string;
  publisher: string;
  release_date: Date | string;
  is_active: boolean;
  min_os: string | null;
  min_storage: string | null;
  min_ram: string | null;
  min_cpu: string | null;
  min_gpu: string | null;
  minimum_requirements?: {
    os?: string;
    storage?: string;
    ram?: string;
    cpu?: string;
    gpu?: string;
  } | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapRowToGame(row: GameRow): Game {
  const minReq = row.minimum_requirements;
  return new Game({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: typeof row.price === 'string' ? Number(row.price) : row.price ?? 0,
    discountPrice:
      row.discount_price !== null && row.discount_price !== undefined
        ? typeof row.discount_price === 'string'
          ? Number(row.discount_price)
          : row.discount_price
        : null,
    stock: row.stock,
    genres: row.genres ?? [],
    coverImage: row.cover_image,
    bannerImage: row.banner_image,
    developer: row.developer,
    publisher: row.publisher,
    releaseDate:
      row.release_date instanceof Date
        ? row.release_date
        : new Date(row.release_date),
    isActive: row.is_active,
    minimumRequirements: {
      os: row.min_os ?? minReq?.os ?? '',
      storage: row.min_storage ?? minReq?.storage ?? '',
      ram: row.min_ram ?? minReq?.ram ?? '',
      cpu: row.min_cpu ?? minReq?.cpu ?? '',
      gpu: row.min_gpu ?? minReq?.gpu ?? '',
    },
    createdAt:
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  });
}

@Injectable()
export class TypeormGameRepository implements GameRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(data: CreateGameData): Promise<Game> {
    const minimumReqJson = data.minimumRequirements
      ? {
          os: data.minimumRequirements.os ?? '',
          storage: data.minimumRequirements.storage ?? '',
          ram: data.minimumRequirements.ram ?? '',
          cpu: data.minimumRequirements.cpu ?? '',
          gpu: data.minimumRequirements.gpu ?? '',
        }
      : null;

    const rows = await this.dataSource.query<GameRow[]>(
      `
      INSERT INTO games (
        title, slug, description, price, discount_price, stock, genres, cover_image, banner_image,
        developer, publisher, release_date, is_active,
        min_os, min_storage, min_ram, min_cpu, min_gpu, minimum_requirements
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *;
      `,
      [
        data.title,
        data.slug,
        data.description,
        data.price ?? 0,
        data.discountPrice ?? null,
        data.stock,
        data.genres ?? [],
        data.coverImage,
        data.bannerImage ?? null,
        data.developer,
        data.publisher,
        data.releaseDate ?? null,
        data.isActive ?? true,
        data.minimumRequirements?.os ?? null,
        data.minimumRequirements?.storage ?? null,
        data.minimumRequirements?.ram ?? null,
        data.minimumRequirements?.cpu ?? null,
        data.minimumRequirements?.gpu ?? null,
        minimumReqJson ? JSON.stringify(minimumReqJson) : null,
      ],
    );
    return mapRowToGame(rows[0]);
  }

  async findById(id: string): Promise<Game | null> {
    try {
      const rows = await this.dataSource.query<GameRow[]>(
        `SELECT * FROM games WHERE id = $1 LIMIT 1`,
        [id],
      );
      return rows[0] ? mapRowToGame(rows[0]) : null;
    } catch {
      return null;
    }
  }

  async findBySlug(slug: string): Promise<Game | null> {
    const rows = await this.dataSource.query<GameRow[]>(
      `SELECT * FROM games WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0] ? mapRowToGame(rows[0]) : null;
  }

  async findAll(filters: GameFilters): Promise<PaginatedResult<Game>> {
    const { search, genre, isActive, sortBy, minPrice, maxPrice, page, limit } =
      filters;
    const take = limit ?? 10;
    const skip = ((page ?? 1) - 1) * take;
    const isActiveValue = isActive ?? true;

    const conditions: string[] = ['is_active = $1'];
    const params: unknown[] = [isActiveValue];
    let paramIndex = 2;

    if (search?.trim()) {
      conditions.push(
        `(title ILIKE $${paramIndex} OR developer ILIKE $${paramIndex} OR publisher ILIKE $${paramIndex})`,
      );
      params.push(`%${escapeLike(search.trim())}%`);
      paramIndex++;
    }

    if (genre?.trim()) {
      conditions.push(`genres @> $${paramIndex}`);
      params.push([genre.trim()]);
      paramIndex++;
    }

    if (minPrice !== undefined && minPrice !== null) {
      conditions.push(`price >= $${paramIndex}`);
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      conditions.push(`price <= $${paramIndex}`);
      params.push(maxPrice);
      paramIndex++;
    }

    const sortColumnMap: Record<string, string> = {
      createdAt: 'created_at',
      title: 'title',
      stock: 'stock',
      price: 'price',
      releaseDate: 'release_date',
    };
    const orderField =
      sortBy && sortColumnMap[sortBy] ? sortColumnMap[sortBy] : 'created_at';

    const rows = await this.dataSource.query<GameRow[]>(
      [
        `SELECT * FROM games WHERE ${conditions.join(' AND ')}`,
        `ORDER BY ${orderField} DESC`,
        `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ].join('\n'),
      [...params, take, skip],
    );

    const countRows = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM games WHERE ${conditions.join(' AND ')}`,
      params,
    );

    const total = Number(countRows[0]?.count ?? 0);

    return {
      items: (rows ?? []).map((row) => mapRowToGame(row)),
      total,
      page: page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async update(id: string, data: UpdateGameData): Promise<Game | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const addSet = (column: string, value: unknown) => {
      if (value !== undefined) {
        sets.push(`${column} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    };

    if (data.title !== undefined) addSet('title', data.title.trim());
    if (data.slug !== undefined) addSet('slug', data.slug.trim());
    if (data.description !== undefined)
      addSet('description', data.description.trim());
    if (data.stock !== undefined) addSet('stock', data.stock);
    if (data.genres !== undefined) addSet('genres', data.genres);
    if (data.coverImage !== undefined) addSet('cover_image', data.coverImage);
    if (data.bannerImage !== undefined)
      addSet('banner_image', data.bannerImage);
    if (data.developer !== undefined)
      addSet('developer', data.developer.trim());
    if (data.publisher !== undefined)
      addSet('publisher', data.publisher.trim());
    if (data.releaseDate !== undefined)
      addSet('release_date', new Date(data.releaseDate));
    if (data.isActive !== undefined) addSet('is_active', data.isActive);
    if (data.price !== undefined) addSet('price', data.price);
    if (data.discountPrice !== undefined)
      addSet('discount_price', data.discountPrice ?? null);

    if (data.minimumRequirements) {
      if (data.minimumRequirements.os !== undefined)
        addSet('min_os', data.minimumRequirements.os);
      if (data.minimumRequirements.storage !== undefined)
        addSet('min_storage', data.minimumRequirements.storage);
      if (data.minimumRequirements.ram !== undefined)
        addSet('min_ram', data.minimumRequirements.ram);
      if (data.minimumRequirements.cpu !== undefined)
        addSet('min_cpu', data.minimumRequirements.cpu);
      if (data.minimumRequirements.gpu !== undefined)
        addSet('min_gpu', data.minimumRequirements.gpu);

      const mergedMinReq = {
        os: data.minimumRequirements.os ?? existing.minimumRequirements?.os ?? '',
        storage:
          data.minimumRequirements.storage ??
          existing.minimumRequirements?.storage ??
          '',
        ram: data.minimumRequirements.ram ?? existing.minimumRequirements?.ram ?? '',
        cpu: data.minimumRequirements.cpu ?? existing.minimumRequirements?.cpu ?? '',
        gpu: data.minimumRequirements.gpu ?? existing.minimumRequirements?.gpu ?? '',
      };
      addSet('minimum_requirements', JSON.stringify(mergedMinReq));
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    await this.dataSource.query(
      `
      UPDATE games
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      `,
      params,
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const exists = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM games WHERE id = $1 AND is_active = TRUE;`,
      [id],
    );
    if (Number(exists[0]?.count ?? 0) === 0) return false;
    await this.dataSource.query(
      `UPDATE games SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
      [id],
    );
    return true;
  }
}
