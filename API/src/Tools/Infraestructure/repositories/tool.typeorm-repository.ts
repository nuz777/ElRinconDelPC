import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tool } from '../../Domain/Entities/tool.entity.js';
import type {
  CreateToolData,
  PaginatedResult,
  ToolFilters,
  ToolRepository,
  UpdateToolData,
} from '../../Domain/interfaces/tool.repository.interface.js';
import { ToolTypeormEntity } from '../entities/tool.typeorm-entity.js';

interface ToolRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  size: string | null;
  download_url: string;
  image_url: string | null;
  tags: string[];
  author_id: string;
  downloads_count: number;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function mapRowToTool(row: ToolRow): Tool {
  return new Tool({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    version: row.version,
    size: row.size,
    downloadUrl: row.download_url,
    imageUrl: row.image_url,
    tags: row.tags ?? [],
    authorId: row.author_id,
    downloadsCount: row.downloads_count,
    isActive: row.is_active,
    createdAt:
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  });
}

@Injectable()
export class TypeormToolRepository implements ToolRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ToolTypeormEntity)
    private readonly repository: Repository<ToolTypeormEntity>,
  ) {}

  private toDomain(row: ToolTypeormEntity): Tool {
    return mapRowToTool({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      version: row.version,
      size: row.size,
      download_url: row.downloadUrl,
      image_url: row.imageUrl,
      tags: row.tags,
      author_id: row.authorId,
      downloads_count: row.downloadsCount,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    } as unknown as ToolRow);
  }

  async create(data: CreateToolData): Promise<Tool> {
    const entity = this.repository.create({
      ...(data.id ? { id: data.id } : {}),
      title: data.title,
      slug: data.slug,
      description: data.description,
      category: data.category,
      version: data.version,
      size: data.size ?? null,
      downloadUrl: data.downloadUrl,
      imageUrl: data.imageUrl ?? null,
      tags: data.tags ?? [],
      authorId: data.authorId,
      downloadsCount: data.downloadsCount ?? 0,
      isActive: data.isActive ?? true,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Tool | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tool | null> {
    const row = await this.repository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { slug } });
    if (!existing) return false;
    if (excludeId && existing.id === excludeId) return false;
    return true;
  }

  async findAll(filters: ToolFilters): Promise<PaginatedResult<Tool>> {
    const { search, category, isActive, page, limit } = filters;
    const take = limit ?? 10;
    const skip = ((page ?? 1) - 1) * take;
    const isActiveValue = isActive ?? true;

    const conditions: string[] = ['is_active = $1'];
    const params: unknown[] = [isActiveValue];
    let paramIndex = 2;

    if (search?.trim()) {
      conditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`,
      );
      params.push(`%${escapeLike(search.trim())}%`);
      paramIndex++;
    }

    if (category?.trim()) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category.trim());
      paramIndex++;
    }

    const rows = await this.dataSource.query<ToolRow[]>(
      [
        `SELECT * FROM tools WHERE ${conditions.join(' AND ')}`,
        `ORDER BY created_at DESC`,
        `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ].join('\n'),
      [...params, take, skip],
    );

    const countRows = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM tools WHERE ${conditions.join(' AND ')}`,
      params,
    );

    const total = Number(countRows[0]?.count ?? 0);

    return {
      items: (rows ?? []).map((row) => mapRowToTool(row)),
      total,
      page: page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async update(id: string, data: UpdateToolData): Promise<Tool | null> {
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

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.repository.increment({ id }, 'downloadsCount', 1);
  }
}
