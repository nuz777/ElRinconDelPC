/* oxlint-disable typescript/unbound-method */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tool } from '../../Domain/Entities/tool.entity.js';
import type { ToolRepository } from '../../Domain/interfaces/tool.repository.interface.js';
import { ToolsService } from './tools.service.js';

const TOOL_ID = 'tool-uuid-1111-2222-3333-444444444444';
const AUTHOR_ID = 'author-user-123';
const OTHER_USER_ID = 'other-user-456';

const buildTool = (override: Partial<Tool> = {}): Tool =>
  new Tool({
    id: TOOL_ID,
    title: '7-Zip',
    slug: '7-zip',
    description: 'Compresor y descompresor de archivos libre.',
    category: 'Utilidades',
    version: 'v24.08',
    size: '1.6 MB',
    downloadUrl: 'https://www.7-zip.org/download.html',
    imageUrl: '/catalogo/7zip.png',
    tags: ['Compresión', 'Archivos'],
    authorId: AUTHOR_ID,
    downloadsCount: 5,
    isActive: true,
    ...override,
  });

describe('ToolsService (Unit)', () => {
  let service: ToolsService;
  let repository: ToolRepository;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      incrementDownloads: vi.fn(),
      slugExists: vi.fn(),
    };
    service = new ToolsService(repository);
  });

  describe('createTool', () => {
    it('debe crear una herramienta exitosamente', async () => {
      vi.mocked(repository.slugExists).mockResolvedValue(false);
      const expected = buildTool();
      vi.mocked(repository.create).mockResolvedValue(expected);

      const result = await service.createTool(AUTHOR_ID, {
        title: '7-Zip',
        description: 'Compresor y descompresor de archivos libre.',
        category: 'Utilidades',
        downloadUrl: 'https://www.7-zip.org/download.html',
      });

      expect(result).toBe(expected);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '7-Zip',
          slug: '7-zip',
          authorId: AUTHOR_ID,
        }),
      );
    });

    it('debe lanzar ConflictException si el slug ya existe', async () => {
      vi.mocked(repository.slugExists).mockResolvedValue(true);

      await expect(
        service.createTool(AUTHOR_ID, {
          title: '7-Zip',
          description: 'Desc',
          downloadUrl: 'https://www.7-zip.org',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getTools', () => {
    it('debe retornar herramientas paginadas', async () => {
      const paginated = {
        items: [buildTool()],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      vi.mocked(repository.findAll).mockResolvedValue(paginated);

      const result = await service.getTools({ category: 'Utilidades', page: 1, limit: 10 });
      expect(result).toBe(paginated);
      expect(repository.findAll).toHaveBeenCalledWith({
        category: 'Utilidades',
        search: undefined,
        isActive: undefined,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getToolById', () => {
    it('debe retornar la herramienta si existe', async () => {
      const tool = buildTool();
      vi.mocked(repository.findById).mockResolvedValue(tool);

      const result = await service.getToolById(TOOL_ID);
      expect(result).toBe(tool);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.getToolById(TOOL_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTool', () => {
    it('debe permitir la edición al autor original', async () => {
      const tool = buildTool();
      const updated = buildTool({ version: 'v24.09' });

      vi.mocked(repository.findById).mockResolvedValue(tool);
      vi.mocked(repository.slugExists).mockResolvedValue(false);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await service.updateTool(TOOL_ID, AUTHOR_ID, 'user', {
        version: 'v24.09',
      });

      expect(result).toBe(updated);
    });

    it('debe lanzar ForbiddenException si otro usuario intenta editar', async () => {
      const tool = buildTool();
      vi.mocked(repository.findById).mockResolvedValue(tool);

      await expect(
        service.updateTool(TOOL_ID, OTHER_USER_ID, 'user', {
          version: 'v24.09',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTool', () => {
    it('debe permitir el borrado lógico al autor', async () => {
      const tool = buildTool();
      vi.mocked(repository.findById).mockResolvedValue(tool);
      vi.mocked(repository.delete).mockResolvedValue(true);

      const result = await service.deleteTool(TOOL_ID, AUTHOR_ID, 'user');
      expect(result).toEqual({
        message: 'Herramienta eliminada correctamente (borrado lógico)',
        id: TOOL_ID,
      });
    });

    it('debe lanzar ForbiddenException si otro usuario intenta borrar', async () => {
      const tool = buildTool();
      vi.mocked(repository.findById).mockResolvedValue(tool);

      await expect(
        service.deleteTool(TOOL_ID, OTHER_USER_ID, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('incrementDownloadCount', () => {
    it('debe llamar a incrementDownloads si la herramienta existe', async () => {
      const tool = buildTool();
      vi.mocked(repository.findById).mockResolvedValue(tool);
      vi.mocked(repository.incrementDownloads).mockResolvedValue();

      await service.incrementDownloadCount(TOOL_ID);
      expect(repository.incrementDownloads).toHaveBeenCalledWith(TOOL_ID);
    });

    it('debe lanzar NotFoundException si no existe la herramienta', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);
      await expect(service.incrementDownloadCount(TOOL_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
