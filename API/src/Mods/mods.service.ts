import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateModDto, UpdateModDto } from './dtos/create-mod.dto.js';

export interface ModItem {
  id: string;
  title: string;
  description: string;
  game: string;
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
export class ModsService {
  private readonly mods: ModItem[] = [];

  findAll(): ModItem[] {
    return [...this.mods];
  }

  findOne(id: string): ModItem {
    const mod = this.mods.find((item) => item.id === id);
    if (!mod) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    return mod;
  }

  create(dto: CreateModDto, createdBy: string): ModItem {
    const now = new Date().toISOString();
    const mod: ModItem = {
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      game: dto.game?.trim() || 'General',
      version: dto.version?.trim() || 'v1.0',
      size: dto.size?.trim() || 'N/A',
      downloadUrl: dto.downloadUrl?.trim() || '#',
      imageUrl: dto.imageUrl?.trim() || '/img/default-mod.png',
      tags: dto.tags ?? ['Mods'],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.mods.unshift(mod);
    return mod;
  }

  update(id: string, dto: UpdateModDto): ModItem {
    const mod = this.findOne(id);
    if (dto.title !== undefined) mod.title = dto.title.trim();
    if (dto.description !== undefined) mod.description = dto.description.trim();
    if (dto.game !== undefined) mod.game = dto.game.trim();
    if (dto.version !== undefined) mod.version = dto.version.trim();
    if (dto.size !== undefined) mod.size = dto.size.trim();
    if (dto.downloadUrl !== undefined) mod.downloadUrl = dto.downloadUrl.trim();
    if (dto.imageUrl !== undefined) mod.imageUrl = dto.imageUrl.trim();
    if (dto.tags !== undefined) mod.tags = dto.tags;
    mod.updatedAt = new Date().toISOString();
    return mod;
  }

  remove(id: string): { deleted: boolean; id: string } {
    const index = this.mods.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Mod con id "${id}" no encontrado`);
    }
    this.mods.splice(index, 1);
    return { deleted: true, id };
  }
}
