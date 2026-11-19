import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generatePublicCode } from '../../../Common/utils/public-code.js';
import { escapeLike, toDate } from '../../../Common/utils/sql.js';
import {
  CatalogItem,
  type CatalogCoverFraming,
  type CatalogMinimumRequirements,
} from '../../Domain/Entities/catalog-item.entity.js';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';
import type {
  CatalogFilters,
  CatalogMediaKind,
  CatalogMediaRecord,
  CatalogRepository,
  CreateCatalogItemData,
  PaginatedResult,
  UpdateCatalogItemData,
} from '../../Domain/interfaces/catalog.repository.interface.js';
import { CatalogItemTypeormEntity } from '../entities/catalog-item.typeorm-entity.js';

const MAX_PUBLIC_CODE_ATTEMPTS = 10;
export const CATALOG_MEDIA_PLACEHOLDER = '__MEDIA__';

interface CatalogRawRow {
  id: string;
  section: CatalogSection;
  title: string;
  genre: string;
  size: string | null;
  version: string | null;
  badge: string | null;
  coverUrl: string | null;
  coverFraming?: CatalogCoverFraming | null;
  bannerUrl?: string | null;
  downloadUrl: string | null;
  developer: string | null;
  shortDescription: string;
  minimumRequirements?: CatalogMinimumRequirements | null;
  publicCode: string | null;
  brand: string | null;
  console: string | null;
  emulator: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const RETURNING_COLUMNS = [
  'id',
  'section',
  'title',
  'genre',
  'size',
  'version',
  'badge',
  'cover_url AS "coverUrl"',
  'cover_framing AS "coverFraming"',
  'banner_url AS "bannerUrl"',
  'download_url AS "downloadUrl"',
  'developer',
  'short_description AS "shortDescription"',
  'minimum_requirements AS "minimumRequirements"',
  'public_code AS "publicCode"',
  'brand',
  'console',
  'emulator',
  'created_at AS "createdAt"',
  'updated_at AS "updatedAt"',
].join(', ');

function isUniquePublicCodeViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as { code?: string; driverError?: { code?: string } };
  return record.code === '23505' || record.driverError?.code === '23505';
}

@Injectable()
export class TypeormCatalogRepository implements CatalogRepository {
  constructor(
    @InjectRepository(CatalogItemTypeormEntity)
    private readonly repository: Repository<CatalogItemTypeormEntity>,
  ) {}

  private toDomain(row: CatalogItemTypeormEntity | CatalogRawRow): CatalogItem {
    return new CatalogItem({
      id: row.id,
      section: row.section,
      title: row.title,
      genre: row.genre,
      size: row.size,
      version: row.version,
      badge: row.badge,
      coverUrl: row.coverUrl,
      coverFraming: row.coverFraming ?? null,
      bannerUrl: row.bannerUrl ?? null,
      downloadUrl: row.downloadUrl,
      developer: row.developer,
      shortDescription: row.shortDescription,
      minimumRequirements: row.minimumRequirements ?? null,
      publicCode: row.publicCode,
      brand: row.brand,
      console: row.console,
      emulator: row.emulator,
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt),
    });
  }

  async findAll(filters: CatalogFilters): Promise<PaginatedResult<CatalogItem>> {
    const { section, genre, search, page, limit, summary } = filters;
    const baseQuery = this.repository.createQueryBuilder('item');

    if (section) {
      baseQuery.andWhere('item.section = :section', { section });
    } else {
      baseQuery.andWhere('item.section != :adultSection', {
        adultSection: CatalogSection.ADULTOS,
      });
    }

    if (genre?.trim()) {
      baseQuery.andWhere('item.genre ILIKE :genre', {
        genre: escapeLike(genre.trim()),
      });
    }

    if (search?.trim()) {
      baseQuery.andWhere(
        '(item.title ILIKE :search OR item.developer ILIKE :search)',
        { search: `%${escapeLike(search.trim())}%` },
      );
    }

    const selectColumns = [
      'item.id AS "id"',
      'item.section AS "section"',
      'item.title AS "title"',
      'item.genre AS "genre"',
      'item.size AS "size"',
      'item.version AS "version"',
      'item.badge AS "badge"',
      `CASE WHEN substring(item.cover_url from 1 for 11) = 'data:image/' THEN '${CATALOG_MEDIA_PLACEHOLDER}' ELSE item.cover_url END AS "coverUrl"`,
      'item.cover_framing AS "coverFraming"',
      ...(summary
        ? []
        : [
            `CASE WHEN substring(item.banner_url from 1 for 11) = 'data:image/' THEN '${CATALOG_MEDIA_PLACEHOLDER}' ELSE item.banner_url END AS "bannerUrl"`,
            'item.minimum_requirements AS "minimumRequirements"',
          ]),
      'item.download_url AS "downloadUrl"',
      'item.developer AS "developer"',
      'item.short_description AS "shortDescription"',
      'item.public_code AS "publicCode"',
      'item.brand AS "brand"',
      'item.console AS "console"',
      'item.emulator AS "emulator"',
      'item.created_at AS "createdAt"',
      'item.updated_at AS "updatedAt"',
    ];

    const rowsQuery = baseQuery
      .clone()
      .select(selectColumns)
      .orderBy('item.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const [rows, total] = await Promise.all([
      rowsQuery.getRawMany<CatalogRawRow>(),
      baseQuery.getCount(),
    ]);

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

  async findByPublicCode(code: string): Promise<CatalogItem | null> {
    const row = await this.repository.findOne({ where: { publicCode: code } });
    return row ? this.toDomain(row) : null;
  }

  async findMedia(
    id: string,
    kind: CatalogMediaKind,
  ): Promise<CatalogMediaRecord | null> {
    const column = kind === 'cover' ? 'item.coverUrl' : 'item.bannerUrl';
    const row = await this.repository
      .createQueryBuilder('item')
      .select([`${column} AS "value"`, 'item.updatedAt AS "updatedAt"'])
      .where('item.id = :id', { id })
      .getRawOne<{ value: string | null; updatedAt: Date | string }>();

    if (!row) return null;
    return {
      value: row.value ?? null,
      updatedAt: toDate(row.updatedAt),
    };
  }

  private buildEntity(
    item: CreateCatalogItemData,
    publicCode: string,
  ): CatalogItemTypeormEntity {
    return this.repository.create({
      publicCode,
      ...(item.id ? { id: item.id } : {}),
      section: item.section,
      title: item.title,
      genre: item.genre,
      size: item.size ?? null,
      version: item.version ?? undefined,
      badge: item.badge ?? null,
      coverUrl: item.coverUrl ?? null,
      coverFraming: item.coverFraming ?? null,
      bannerUrl: item.bannerUrl ?? null,
      brand: item.brand ?? null,
      console: item.console ?? null,
      emulator: item.emulator ?? null,
      downloadUrl: item.downloadUrl ?? null,
      developer: item.developer ?? null,
      shortDescription: item.shortDescription,
      minimumRequirements: item.minimumRequirements ?? null,
    });
  }

  async create(item: CreateCatalogItemData): Promise<CatalogItem> {
    if (item.publicCode) {
      const saved = await this.repository.save(
        this.buildEntity(item, item.publicCode),
      );
      return this.toDomain(saved);
    }

    // Inserta directamente sin SELECT exists() previo; solo reintenta si hay colisión (23505)
    for (let attempt = 0; attempt < MAX_PUBLIC_CODE_ATTEMPTS; attempt++) {
      const publicCode = generatePublicCode();
      try {
        const saved = await this.repository.save(
          this.buildEntity(item, publicCode),
        );
        return this.toDomain(saved);
      } catch (err) {
        if (isUniquePublicCodeViolation(err)) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('No se pudo generar un código público único para el ítem.');
  }

  async update(
    id: string,
    item: UpdateCatalogItemData,
  ): Promise<CatalogItem | null> {
    // El código público es fijo: nunca se sobrescribe en una actualización.
    const { publicCode: _ignored, ...changes } = item as UpdateCatalogItemData & {
      publicCode?: unknown;
    };

    const setPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        setPayload[key] = value;
      }
    }

    if (Object.keys(setPayload).length === 0) {
      return this.findById(id);
    }

    setPayload.updatedAt = new Date();

    const result = await this.repository
      .createQueryBuilder()
      .update(CatalogItemTypeormEntity)
      .set(setPayload)
      .where('id = :id', { id })
      .returning(RETURNING_COLUMNS)
      .execute();

    const row = (result.raw as CatalogRawRow[] | undefined)?.[0];
    return row ? this.toDomain(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
