import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Mod } from '../../Domain/Entities/mod.entity.js';
import type {
  CreateModData,
  ModFilters,
  ModRepository,
  PaginatedResult,
  UpdateModData,
} from '../../Domain/interfaces/mod.repository.interface.js';
import { ModTypeormEntity } from '../entities/mod.typeorm-entity.js';

interface ModRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  version: string;
  download_url: string;
  file_size: string | null;
  thumbnail_url: string | null;
  game_id: string;
  author_id: string;
  downloads_count: number;
  is_approved: boolean;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function mapRowToMod(row: ModRow): Mod {
  return new Mod({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    version: row.version,
    downloadUrl: row.download_url,
    fileSize: row.file_size,
    thumbnailUrl: row.thumbnail_url,
    gameId: row.game_id,
    authorId: row.author_id,
    downloadsCount: row.downloads_count,
    isApproved: row.is_approved,
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  });
}

@Injectable()
export class TypeormModRepository implements ModRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ModTypeormEntity)
    private readonly repository: Repository<ModTypeormEntity>,
  ) {}

  private toDomain(row: ModTypeormEntity): Mod {
    return new Mod({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      version: row.version,
      downloadUrl: row.downloadUrl,
      fileSize: row.fileSize,
      thumbnailUrl: row.thumbnailUrl,
      gameId: row.gameId,
      authorId: row.authorId,
      downloadsCount: row.downloadsCount,
      isApproved: row.isApproved,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(data: CreateModData): Promise<Mod> {
    const entity = this.repository.create({
      title: data.title,
      slug: data.slug,
      description: data.description,
      version: data.version,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      gameId: data.gameId,
      authorId: data.authorId,
      downloadsCount: data.downloadsCount ?? 0,
      isApproved: data.isApproved ?? false,
      isActive: data.isActive ?? true,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Mod | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Mod | null> {
    const row = await this.repository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findByGameId(
    gameId: string,
    filters: ModFilters,
  ): Promise<PaginatedResult<Mod>> {
    const { isApproved, isActive, search, page, limit } = filters;
    const take = limit ?? 10;
    const skip = ((page ?? 1) - 1) * take;
    const isActiveValue = isActive ?? true;

    const conditions: string[] = ['game_id = $1', 'is_active = $2'];
    const params: unknown[] = [gameId, isActiveValue];
    let paramIndex = 3;

    if (isApproved !== undefined) {
      conditions.push(`is_approved = $${paramIndex}`);
      params.push(isApproved);
      paramIndex++;
    }

    if (search?.trim()) {
      conditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR version ILIKE $${paramIndex})`,
      );
      params.push(`%${escapeLike(search.trim())}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const rows = await this.dataSource.query<ModRow[]>(
      [
        `SELECT * FROM mods WHERE ${whereClause}`,
        `ORDER BY created_at DESC`,
        `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ].join('\n'),
      [...params, take, skip],
    );

    const countRows = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM mods WHERE ${whereClause}`,
      params,
    );

    const total = Number(countRows[0]?.count ?? 0);

    return {
      items: (rows ?? []).map((row) => mapRowToMod(row)),
      total,
      page: page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async update(id: string, data: UpdateModData): Promise<Mod | null> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) return null;

    const merged = this.repository.merge(existing, {
      ...data,
      slug: data.slug ?? existing.slug,
    });
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) return false;
    existing.isActive = false;
    const saved = await this.repository.save(existing);
    return saved.isActive === false;
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.repository.increment({ id }, 'downloadsCount', 1);
  }

  async approve(id: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) return false;
    existing.isApproved = true;
    const saved = await this.repository.save(existing);
    return saved.isApproved === true;
  }
}
