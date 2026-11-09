import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogItem } from '../../Domain/Entities/catalog-item.entity.js';
import type {
  CatalogFilters,
  CatalogRepository,
  CreateCatalogItemData,
  PaginatedResult,
  UpdateCatalogItemData,
} from '../../Domain/interfaces/catalog.repository.interface.js';
import { CatalogItemTypeormEntity } from '../entities/catalog-item.typeorm-entity.js';

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

@Injectable()
export class TypeormCatalogRepository implements CatalogRepository {
  constructor(
    @InjectRepository(CatalogItemTypeormEntity)
    private readonly repository: Repository<CatalogItemTypeormEntity>,
  ) {}

  private toDomain(row: CatalogItemTypeormEntity): CatalogItem {
    return new CatalogItem({
      id: row.id,
      section: row.section,
      title: row.title,
      genre: row.genre,
      size: row.size,
      version: row.version,
      badge: row.badge,
      coverUrl: row.coverUrl,
      downloadUrl: row.downloadUrl,
      developer: row.developer,
      shortDescription: row.shortDescription,
      minimumRequirements: row.minimumRequirements ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findAll(filters: CatalogFilters): Promise<PaginatedResult<CatalogItem>> {
    const { section, genre, search, page, limit } = filters;
    const query = this.repository.createQueryBuilder('item');

    if (section) {
      query.andWhere('item.section = :section', { section });
    }

    if (genre?.trim()) {
      query.andWhere('item.genre ILIKE :genre', {
        genre: escapeLike(genre.trim()),
      });
    }

    if (search?.trim()) {
      query.andWhere(
        '(item.title ILIKE :search OR item.developer ILIKE :search)',
        { search: `%${escapeLike(search.trim())}%` },
      );
    }

    const [rows, total] = await query
      .orderBy('item.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CatalogItem | null> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(item: CreateCatalogItemData): Promise<CatalogItem> {
    const entity = this.repository.create({
      ...(item.id ? { id: item.id } : {}),
      section: item.section,
      title: item.title,
      genre: item.genre,
      size: item.size ?? null,
      version: item.version ?? undefined,
      badge: item.badge ?? null,
      coverUrl: item.coverUrl ?? null,
      downloadUrl: item.downloadUrl ?? null,
      developer: item.developer ?? null,
      shortDescription: item.shortDescription,
      minimumRequirements: item.minimumRequirements ?? null,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    item: UpdateCatalogItemData,
  ): Promise<CatalogItem | null> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) return null;

    const merged = this.repository.merge(existing, item);
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
