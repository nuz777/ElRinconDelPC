import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tool } from '../../Domain/Entities/tool.entity.js';
import {
  TOOLS_REPOSITORY,
  type CreateToolData,
  type PaginatedResult,
  type ToolFilters,
  type ToolRepository,
  type UpdateToolData,
} from '../../Domain/interfaces/tool.repository.interface.js';
import { slugify } from '../../../Common/utils/slugify.js';
import type { CreateToolDto } from '../DTOs/create-tool.dto.js';
import type { FilterToolsDto } from '../DTOs/filter-tools.dto.js';
import type { UpdateToolDto } from '../DTOs/update-tool.dto.js';

@Injectable()
export class ToolsService {
  constructor(
    @Inject(TOOLS_REPOSITORY)
    private readonly toolsRepository: ToolRepository,
  ) {}

  async createTool(authorId: string, dto: CreateToolDto): Promise<Tool> {
    const slug = dto.slug?.trim() || slugify(dto.title);

    // Validar unicidad de slug
    const slugExists = await this.toolsRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictException(
        `Ya existe una herramienta con el slug "${slug}"`,
      );
    }

    const data: CreateToolData = {
      title: dto.title,
      slug,
      description: dto.description,
      category: dto.category ?? 'Utilidades',
      version: dto.version ?? 'v1.0',
      size: dto.size ?? null,
      downloadUrl: dto.downloadUrl,
      imageUrl: dto.imageUrl ?? null,
      tags: dto.tags ?? [],
      authorId,
      downloadsCount: 0,
      isActive: true,
    };

    return this.toolsRepository.create(data);
  }

  async getTools(filters: FilterToolsDto): Promise<PaginatedResult<Tool>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const toolFilters: ToolFilters = {
      search: filters.search?.trim() || undefined,
      category: filters.category?.trim() || undefined,
      isActive: filters.isActive,
      page,
      limit,
    };

    return this.toolsRepository.findAll(toolFilters);
  }

  async getToolById(id: string): Promise<Tool> {
    const tool = await this.toolsRepository.findById(id);
    if (!tool) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    return tool;
  }

  async updateTool(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateToolDto,
  ): Promise<Tool> {
    const existing = await this.toolsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }

    // Solo el autor o un administrador pueden editar
    if (!existing.canBeModifiedBy(userId, userRole)) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta herramienta',
      );
    }

    let slug = existing.slug;

    if (dto.title !== undefined && dto.title.trim() !== existing.title) {
      slug = slugify(dto.title.trim());
    } else if (dto.slug !== undefined) {
      slug = dto.slug.trim();
    }

    // Validar unicidad de slug (excluyendo el propio registro)
    if (slug !== existing.slug) {
      const slugExists = await this.toolsRepository.slugExists(slug, id);
      if (slugExists) {
        throw new ConflictException(
          `Ya existe una herramienta con el slug "${slug}"`,
        );
      }
    }

    const data: UpdateToolData = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (slug !== existing.slug) data.slug = slug;
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.version !== undefined) data.version = dto.version.trim();
    if (dto.size !== undefined) data.size = dto.size.trim();
    if (dto.downloadUrl !== undefined && dto.downloadUrl !== null)
      data.downloadUrl = dto.downloadUrl.trim();
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.tags !== undefined) data.tags = dto.tags;

    const updated = await this.toolsRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    return updated;
  }

  async deleteTool(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string; id: string }> {
    const existing = await this.toolsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }

    // Solo el autor o un administrador pueden eliminar
    if (!existing.canBeModifiedBy(userId, userRole)) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta herramienta',
      );
    }

    const deleted = await this.toolsRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    return { message: 'Herramienta eliminada correctamente (borrado lógico)', id };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const tool = await this.toolsRepository.findById(id);
    if (!tool) {
      throw new NotFoundException(`Herramienta con id "${id}" no encontrada`);
    }
    await this.toolsRepository.incrementDownloads(id);
  }
}
