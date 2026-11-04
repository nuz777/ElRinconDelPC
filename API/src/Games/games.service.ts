import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateGameDto, UpdateGameDto } from './dtos/create-game.dto.js';

export interface GameItem {
  id: string;
  title: string;
  description: string;
  version: string;
  size: string;
  downloadUrl: string;
  imageUrl: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class GamesService {
  private readonly games: GameItem[] = [];

  findAll(): GameItem[] {
    return [...this.games];
  }

  findOne(id: string): GameItem {
    const game = this.games.find((item) => item.id === id);
    if (!game) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    return game;
  }

  create(dto: CreateGameDto, createdBy: string): GameItem {
    const now = new Date().toISOString();
    const game: GameItem = {
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      version: dto.version?.trim() || 'v1.0',
      size: dto.size?.trim() || 'N/A',
      downloadUrl: dto.downloadUrl?.trim() || '#',
      imageUrl: dto.imageUrl?.trim() || '/img/default-game.png',
      tags: dto.tags ?? ['Juegos'],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.games.unshift(game);
    return game;
  }

  update(id: string, dto: UpdateGameDto): GameItem {
    const game = this.findOne(id);
    if (dto.title !== undefined) game.title = dto.title.trim();
    if (dto.description !== undefined)
      game.description = dto.description.trim();
    if (dto.version !== undefined) game.version = dto.version.trim();
    if (dto.size !== undefined) game.size = dto.size.trim();
    if (dto.downloadUrl !== undefined)
      game.downloadUrl = dto.downloadUrl.trim();
    if (dto.imageUrl !== undefined) game.imageUrl = dto.imageUrl.trim();
    if (dto.tags !== undefined) game.tags = dto.tags;
    game.updatedAt = new Date().toISOString();
    return game;
  }

  remove(id: string): { deleted: boolean; id: string } {
    const index = this.games.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Juego con id "${id}" no encontrado`);
    }
    this.games.splice(index, 1);
    return { deleted: true, id };
  }
}
