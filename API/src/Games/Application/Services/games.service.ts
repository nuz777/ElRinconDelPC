import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Game } from '../../Domain/Entities/game.entity.js';
import {
  GAMES_REPOSITORY,
  type CreateGameData,
  type GameFilters,
  type GameRepository,
  type PaginatedResult,
  type UpdateGameData,
} from '../../Domain/interfaces/game.repository.interface.js';
import type { CreateGameDto } from '../DTOs/create-game.dto.js';
import type { FilterGamesDto } from '../DTOs/filter-games.dto.js';
import type { UpdateGameDto } from '../DTOs/update-game.dto.js';

/** Convierte un título en un slug válido para URLs. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class GamesService {
  constructor(
    @Inject(GAMES_REPOSITORY)
    private readonly gamesRepository: GameRepository,
  ) {}

  async createGame(dto: CreateGameDto): Promise<Game> {
    const title = dto.title.trim();
    const slug = dto.slug ? dto.slug.trim() : slugify(title);

    // Evitar duplicados por slug
    const existingBySlug = await this.gamesRepository.findBySlug(slug);
    if (existingBySlug) {
      throw new ConflictException(`Ya existe un juego con el slug "${slug}"`);
    }

    // Evitar duplicados por título (si el slug generado difiere del enviado)
    const titleSlug = slugify(title);
    if (titleSlug !== slug) {
      const existingByTitle = await this.gamesRepository.findBySlug(titleSlug);
      if (existingByTitle) {
        throw new ConflictException(`Ya existe un juego con el título "${title}"`);
      }
    }

    const data: CreateGameData = {
      title,
      slug,
      description: dto.description.trim(),
      price: dto.price ?? 0,
      discountPrice: dto.discountPrice ?? null,
      stock: dto.stock,
      genres: dto.genres ?? [],
      coverImage: dto.coverImage,
      bannerImage: dto.bannerImage ?? null,
      developer: dto.developer.trim(),
      publisher: dto.publisher.trim(),
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : new Date(),
      isActive: dto.isActive ?? true,
      minimumRequirements: dto.minimumRequirements,
    };

    return this.gamesRepository.create(data);
  }

  async getGames(filters: FilterGamesDto): Promise<PaginatedResult<Game>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const gameFilters: GameFilters = {
      search: filters.search?.trim() || undefined,
      genre: filters.genre?.trim() || undefined,
      sortBy: filters.sortBy,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      page,
      limit,
    };

    return this.gamesRepository.findAll(gameFilters);
  }

  async getGameById(id: string): Promise<Game> {
    const game = await this.gamesRepository.findById(id);
    if (!game) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    return game;
  }

  async getGameBySlug(slug: string): Promise<Game> {
    const game = await this.gamesRepository.findBySlug(slug);
    if (!game) {
      throw new NotFoundException(`Juego con slug "${slug}" no encontrado`);
    }
    return game;
  }

  /** Intenta localizar un juego por UUID; si no existe, intenta por slug. */
  async resolveId(id: string): Promise<Game | null> {
    let game = await this.gamesRepository.findById(id);
    if (!game) {
      game = await this.gamesRepository.findBySlug(id);
    }
    return game;
  }

  async updateGame(id: string, dto: UpdateGameDto): Promise<Game> {
    const existing = await this.resolveId(id);
    if (!existing) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }

    let slug = existing.slug;

    // Recalcular slug si cambia el título
    if (dto.title !== undefined) {
      const newTitle = dto.title.trim();
      slug = dto.slug ? dto.slug.trim() : slugify(newTitle);
    } else if (dto.slug !== undefined) {
      slug = dto.slug.trim();
    }

    // Validar que el slug destino no lo use otro juego
    if (slug !== existing.slug) {
      const existingBySlug = await this.gamesRepository.findBySlug(slug);
      if (existingBySlug && existingBySlug.id !== existing.id) {
        throw new ConflictException(`Ya existe un juego con el slug "${slug}"`);
      }
    }

    const data: UpdateGameData = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (slug !== existing.slug) data.slug = slug;
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.genres !== undefined) data.genres = dto.genres;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.bannerImage !== undefined) data.bannerImage = dto.bannerImage;
    if (dto.developer !== undefined) data.developer = dto.developer.trim();
    if (dto.publisher !== undefined) data.publisher = dto.publisher.trim();
    if (dto.releaseDate !== undefined)
      data.releaseDate = new Date(dto.releaseDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.discountPrice !== undefined) data.discountPrice = dto.discountPrice;
    if (dto.minimumRequirements !== undefined)
      data.minimumRequirements = dto.minimumRequirements;

    const updated = await this.gamesRepository.update(existing.id, data);
    if (!updated) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    return updated;
  }

  async deleteGame(id: string): Promise<{ message: string; id: string }> {
    let existing = await this.gamesRepository.findById(id);
    if (!existing) {
      existing = await this.gamesRepository.findBySlug(id);
    }
    if (!existing) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    const deleted = await this.gamesRepository.delete(existing.id);
    if (!deleted) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    return { message: 'Juego eliminado correctamente (borrado lógico)', id: existing.id };
  }
}
