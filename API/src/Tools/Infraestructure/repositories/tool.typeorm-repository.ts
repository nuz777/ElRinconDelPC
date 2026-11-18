import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { escapeLike, isUuid, toDate } from '../../../Common/utils/sql.js';
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
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
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
    return new Tool({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      version: row.version,
      size: row.size,
      downloadUrl: row.downloadUrl,
      imageUrl: row.imageUrl,
      tags: row.tags ?? [],
      authorId: row.authorId,
      downloadsCount: row.downloadsCount,
      isActive: row.isActive,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt),
    });
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
    if (!isUuid(id)) return null;
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tool | null> {
    const row = await this.repository.findOne({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.repository.findOne({
      where: { slug },
      select: { id: true },
    });
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

    const whereClause = conditions.join(' AND ');
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<ToolRow[]>(
        [
          `SELECT * FROM tools WHERE ${whereClause}`,
          `ORDER BY created_at DESC`,
          `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        ].join('\n'),
        [...params, take, skip],
      ),
      this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM tools WHERE ${whereClause}`,
        params,
      ),
    ]);

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
    if (!isUuid(id)) return null;

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

    if (data.title !== undefined) addSet('title', data.title);
    if (data.slug !== undefined) addSet('slug', data.slug);
    if (data.description !== undefined) addSet('description', data.description);
    if (data.category !== undefined) addSet('category', data.category);
    if (data.version !== undefined) addSet('version', data.version);
    if (data.size !== undefined) addSet('size', data.size);
    if (data.downloadUrl !== undefined) addSet('download_url', data.downloadUrl);
    if (data.imageUrl !== undefined) addSet('image_url', data.imageUrl);
    if (data.tags !== undefined) addSet('tags', data.tags);
    if (data.isActive !== undefined) addSet('is_active', data.isActive);

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const rows = await this.dataSource.query<ToolRow[]>(
      `
      UPDATE tools
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
      `,
      params,
    );
    return rows[0] ? mapRowToTool(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const result = await this.repository.update({ id }, { isActive: false });
    return (result.affected ?? 0) > 0;
  }

  async hardDelete(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.repository.increment({ id }, 'downloadsCount', 1);
  }

  async incrementDownloadsIfExists(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const rows = await this.dataSource.query<{ id: string }[]>(
      `
      UPDATE tools
      SET downloads_count = downloads_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = TRUE
      RETURNING id;
      `,
      [id],
    );
    return (rows?.length ?? 0) > 0;
  }
}
