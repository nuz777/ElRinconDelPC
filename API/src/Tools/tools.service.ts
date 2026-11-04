import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateToolDto, UpdateToolDto } from './dtos/create-tool.dto.js';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: string;
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
export class ToolsService {
  private readonly tools: ToolItem[] = [];

  findAll(): ToolItem[] {
    return [...this.tools];
  }

  findOne(id: string): ToolItem {
    const tool = this.tools.find((item) => item.id === id);
    if (!tool) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    return tool;
  }

  create(dto: CreateToolDto, createdBy: string): ToolItem {
    const now = new Date().toISOString();
    const tool: ToolItem = {
      id: randomUUID(),
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category?.trim() || 'Utilidades',
      version: dto.version?.trim() || 'v1.0',
      size: dto.size?.trim() || 'N/A',
      downloadUrl: dto.downloadUrl?.trim() || '#',
      imageUrl: dto.imageUrl?.trim() || '/img/default-tool.png',
      tags: dto.tags ?? ['Herramientas'],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.tools.unshift(tool);
    return tool;
  }

  update(id: string, dto: UpdateToolDto): ToolItem {
    const tool = this.findOne(id);
    if (dto.title !== undefined) tool.title = dto.title.trim();
    if (dto.description !== undefined)
      tool.description = dto.description.trim();
    if (dto.category !== undefined) tool.category = dto.category.trim();
    if (dto.version !== undefined) tool.version = dto.version.trim();
    if (dto.size !== undefined) tool.size = dto.size.trim();
    if (dto.downloadUrl !== undefined)
      tool.downloadUrl = dto.downloadUrl.trim();
    if (dto.imageUrl !== undefined) tool.imageUrl = dto.imageUrl.trim();
    if (dto.tags !== undefined) tool.tags = dto.tags;
    tool.updatedAt = new Date().toISOString();
    return tool;
  }

  remove(id: string): { deleted: boolean; id: string } {
    const index = this.tools.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    this.tools.splice(index, 1);
    return { deleted: true, id };
  }
}
