import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { escapeLike, isUuid, toDate } from '../../../Common/utils/sql.js';
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
  game_id: string | null;
  author_id: string;
  downloads_count: number;
  is_approved: boolean;
  is_active: boolean;
  min_os: string | null;
  min_storage: string | null;
  min_ram: string | null;
  min_cpu: string | null;
  min_gpu: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface GameRow {
  id: string;
  title: string;
}

interface AuthorRow {
  id: string;
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
    minimumRequirements: {
      os: row.min_os ?? '',
      storage: row.min_storage ?? '',
      ram: row.min_ram ?? '',
      cpu: row.min_cpu ?? '',
      gpu: row.min_gpu ?? '',
    },
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
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
      minimumRequirements: {
        os: row.minOs ?? '',
        storage: row.minStorage ?? '',
        ram: row.minRam ?? '',
        cpu: row.minCpu ?? '',
        gpu: row.minGpu ?? '',
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(data: CreateModData): Promise<Mod> {
    const entity = this.repository.create({
      ...(data.id ? { id: data.id } : {}),
      title: data.title,
      slug: data.slug,
      description: data.description,
      version: data.version,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      gameId: data.gameId ?? null,
      authorId: data.authorId,
      downloadsCount: data.downloadsCount ?? 0,
      isApproved: data.isApproved ?? false,
      isActive: data.isActive ?? true,
      minOs: data.minimumRequirements?.os ?? null,
      minStorage: data.minimumRequirements?.storage ?? null,
      minRam: data.minimumRequirements?.ram ?? null,
      minCpu: data.minimumRequirements?.cpu ?? null,
      minGpu: data.minimumRequirements?.gpu ?? null,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Mod | null> {
    if (!isUuid(id)) return null;
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string, gameId: string | null): Promise<Mod | null> {
    const row = await this.repository.findOne({
      where: { slug, gameId: gameId ?? IsNull() },
    });
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
    const [rows, countRows] = await Promise.all([
      this.dataSource.query<ModRow[]>(
        [
          `SELECT * FROM mods WHERE ${whereClause}`,
          `ORDER BY created_at DESC`,
          `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        ].join('\n'),
        [...params, take, skip],
      ),
      this.dataSource.query<{ count: string }[]>(
        `SELECT COUNT(*)::int AS count FROM mods WHERE ${whereClause}`,
        params,
      ),
    ]);

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
    if (data.version !== undefined) addSet('version', data.version);
    if (data.downloadUrl !== undefined) addSet('download_url', data.downloadUrl);
    if (data.fileSize !== undefined) addSet('file_size', data.fileSize);
    if (data.thumbnailUrl !== undefined)
      addSet('thumbnail_url', data.thumbnailUrl);
    if (data.gameId !== undefined) addSet('game_id', data.gameId);
    if (data.isApproved !== undefined) addSet('is_approved', data.isApproved);
    if (data.isActive !== undefined) addSet('is_active', data.isActive);

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
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const rows = await this.dataSource.query<ModRow[]>(
      `
      UPDATE mods
      SET ${sets.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
      `,
      params,
    );
    return rows[0] ? mapRowToMod(rows[0]) : null;
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

  async incrementAndGetDownloadUrl(id: string): Promise<string | null> {
    if (!isUuid(id)) return null;
    const rows = await this.dataSource.query<{ download_url: string }[]>(
      `
      UPDATE mods
      SET downloads_count = downloads_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = TRUE
      RETURNING download_url;
      `,
      [id],
    );
    return rows[0]?.download_url ?? null;
  }

  async approve(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    const result = await this.repository.update({ id }, { isApproved: true });
    return (result.affected ?? 0) > 0;
  }

  async approveAndReturn(id: string): Promise<Mod | null> {
    if (!isUuid(id)) return null;
    const rows = await this.dataSource.query<ModRow[]>(
      `
      UPDATE mods
      SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
      `,
      [id],
    );
    return rows[0] ? mapRowToMod(rows[0]) : null;
  }

  async gameExists(gameId: string): Promise<boolean> {
    if (!isUuid(gameId)) return false;
    const rows = await this.dataSource.query<unknown[]>(
      `SELECT 1 FROM games WHERE id = $1 LIMIT 1`,
      [gameId],
    );
    return (rows?.length ?? 0) > 0;
  }

  async findDetailsById(id: string): Promise<{
    mod: Mod;
    game: { id: string; title: string } | null;
    author: { id: string } | null;
  } | null> {
    if (!isUuid(id)) return null;
    const rows = await this.dataSource.query<
      (ModRow & { game_title: string | null })[]
    >(
      `
      SELECT m.*, g.title AS game_title
      FROM mods m
      LEFT JOIN games g ON g.id = m.game_id
      WHERE m.id = $1
      LIMIT 1;
      `,
      [id],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      mod: mapRowToMod(row),
      game:
        row.game_id && row.game_title
          ? { id: row.game_id, title: row.game_title }
          : null,
      author: { id: row.author_id },
    };
  }

  async getModDetails(id: string): Promise<{
    game: { id: string; title: string } | null;
    author: { id: string } | null;
  } | null> {
    const mod = await this.repository.findOne({ where: { id } });
    if (!mod) return null;

    const [gameRows, authorRows] = await Promise.all([
      mod.gameId
        ? this.dataSource
            .query<GameRow[]>(
              `SELECT id, title FROM games WHERE id = $1 LIMIT 1`,
              [mod.gameId],
            )
            .catch(() => [])
        : Promise.resolve([]),
      this.dataSource
        .query<AuthorRow[]>(
          `SELECT id FROM users WHERE id = $1 LIMIT 1`,
          [mod.authorId],
        )
        .catch(() => []),
    ]);

    return {
      game: gameRows[0] ?? null,
      author: authorRows[0] ?? null,
    };
  }
}
