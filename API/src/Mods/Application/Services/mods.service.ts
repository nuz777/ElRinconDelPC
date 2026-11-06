import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Mod } from '../../Domain/Entities/mod.entity.js';
import {
  MODS_REPOSITORY,
  type CreateModData,
  type ModFilters,
  type ModRepository,
  type PaginatedResult,
  type UpdateModData,
} from '../../Domain/interfaces/mod.repository.interface.js';
import type { CreateModDto } from '../DTOs/create-mod.dto.js';
import type { FilterModsDto } from '../DTOs/filter-mods.dto.js';
import type { UpdateModDto } from '../DTOs/update-mod.dto.js';

/** Convierte un título en un slug válido para URLs. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface GameRow {
  id: string;
  title: string;
}

interface AuthorRow {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class ModsService {
  constructor(
    @Inject(MODS_REPOSITORY)
    private readonly modsRepository: ModRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createMod(userId: string, dto: CreateModDto): Promise<Mod> {
    // Validar que el juego exista
    const gameRows = await this.dataSource.query<GameRow[]>(
      `SELECT id, title FROM games WHERE id = $1 LIMIT 1`,
      [dto.gameId],
    );
    if (gameRows.length === 0) {
      throw new NotFoundException('El juego especificado no existe');
    }

    const slug = slugify(dto.title);

    // Validar que el slug no exista para este juego
    const existingBySlug = await this.modsRepository.findBySlug(slug);
    if (existingBySlug && existingBySlug.gameId === dto.gameId) {
      throw new ConflictException(
        `Ya existe un mod con el slug "${slug}" para este juego`,
      );
    }

    const data: CreateModData = {
      title: dto.title,
      slug,
      description: dto.description,
      version: dto.version,
      downloadUrl: dto.downloadUrl,
      fileSize: dto.fileSize ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      gameId: dto.gameId,
      authorId: userId,
      downloadsCount: 0,
      isApproved: false,
      isActive: true,
      minimumRequirements: dto.minimumRequirements,
    };

    return this.modsRepository.create(data);
  }

  async getModsByGame(
    gameId: string,
    filters: FilterModsDto,
  ): Promise<PaginatedResult<Mod>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const modFilters: ModFilters = {
      gameId,
      search: filters.search?.trim() || undefined,
      isApproved: true,
      isActive: true,
      page,
      limit,
    };

    return this.modsRepository.findByGameId(gameId, modFilters);
  }

  async getModById(id: string): Promise<{
    mod: Mod;
    game: { id: string; title: string } | null;
    author: { id: string; email: string; role: string } | null;
  }> {
    const mod = await this.modsRepository.findById(id);
    if (!mod) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }

    const [gameRows, authorRows] = await Promise.all([
      this.dataSource.query<GameRow[]>(
        `SELECT id, title FROM games WHERE id = $1 LIMIT 1`,
        [mod.gameId],
      ),
      this.dataSource.query<AuthorRow[]>(
        `SELECT id, email, role FROM users WHERE id = $1 LIMIT 1`,
        [mod.authorId],
      ),
    ]);

    return {
      mod,
      game: gameRows[0] ?? null,
      author: authorRows[0] ?? null,
    };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const mod = await this.modsRepository.findById(id);
    if (!mod) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    await this.modsRepository.incrementDownloads(id);
  }

  async updateMod(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateModDto,
  ): Promise<Mod> {
    const existing = await this.modsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }

    // Solo el autor o un administrador pueden editar
    if (existing.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        'No tienes permiso para editar este mod',
      );
    }

    let slug = existing.slug;

    if (dto.title !== undefined && dto.title.trim() !== existing.title) {
      slug = slugify(dto.title.trim());
    } else if (dto.slug !== undefined) {
      slug = dto.slug.trim();
    }

    // Validar que el slug destino no lo use otro mod del mismo juego
    if (slug !== existing.slug) {
      const existingBySlug = await this.modsRepository.findBySlug(slug);
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(`Ya existe un mod con el slug "${slug}"`);
      }
    }

    const data: UpdateModData = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (slug !== existing.slug) data.slug = slug;
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.version !== undefined) data.version = dto.version.trim();
    if (dto.downloadUrl !== undefined) data.downloadUrl = dto.downloadUrl.trim();
    if (dto.fileSize !== undefined) data.fileSize = dto.fileSize;
    if (dto.thumbnailUrl !== undefined)
      data.thumbnailUrl = dto.thumbnailUrl;
    if (dto.minimumRequirements !== undefined)
      data.minimumRequirements = dto.minimumRequirements;

    const updated = await this.modsRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    return updated;
  }

  async deleteMod(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string; id: string }> {
    const existing = await this.modsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }

    // Solo el autor o un administrador pueden eliminar
    if (existing.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este mod',
      );
    }

    const deleted = await this.modsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    return { message: 'Mod eliminado correctamente (borrado lógico)', id };
  }

  async approveMod(id: string): Promise<Mod> {
    const mod = await this.modsRepository.findById(id);
    if (!mod) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    const approved = await this.modsRepository.approve(id);
    if (!approved) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    const updated = await this.modsRepository.findById(id);
    if (!updated) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    return updated;
  }
}
