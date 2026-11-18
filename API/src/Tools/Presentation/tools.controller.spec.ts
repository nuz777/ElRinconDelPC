/* oxlint-disable typescript/unbound-method */
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../../Auth/Infraestructure/security/jwt.strategy.js';
import type { ToolsService } from '../Application/Services/tools.service.js';
import { Tool } from '../Domain/Entities/tool.entity.js';
import { ToolsController } from './tools.controller.js';

const TOOL_ID = '22222222-3333-4444-5555-666666666666';

const buildTool = (): Tool =>
  new Tool({
    id: TOOL_ID,
    title: '7-Zip',
    slug: '7-zip',
    description: 'Compresor',
    category: 'Utilidades',
    version: 'v24.0',
    size: '1.5 MB',
    downloadUrl: 'https://www.7-zip.org',
    imageUrl: null,
    tags: [],
    authorId: 'admin-1',
  });

describe('ToolsController (Unit)', () => {
  let controller: ToolsController;
  let toolsService: ToolsService;

  beforeEach(() => {
    toolsService = {
      getTools: vi.fn(),
      getToolById: vi.fn(),
      incrementDownloadCount: vi.fn(),
      createTool: vi.fn(),
      updateTool: vi.fn(),
      deleteTool: vi.fn(),
    } as unknown as ToolsService;

    controller = new ToolsController(toolsService);
  });

  it('delega todas las operaciones HTTP en ToolsService', async () => {
    const tool = buildTool();
    const req = {
      user: { id: 'admin-1', userId: 'admin-1', email: 'a@b.com', role: 'admin' },
    } as unknown as Request & { user: AuthenticatedUser };

    vi.mocked(toolsService.getTools).mockResolvedValue({
      items: [tool],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    vi.mocked(toolsService.getToolById).mockResolvedValue(tool);
    vi.mocked(toolsService.incrementDownloadCount).mockResolvedValue();
    vi.mocked(toolsService.createTool).mockResolvedValue(tool);
    vi.mocked(toolsService.updateTool).mockResolvedValue(tool);
    vi.mocked(toolsService.deleteTool).mockResolvedValue({ message: 'ok', id: TOOL_ID });

    await expect(controller.findAll({ page: 1, limit: 10 })).resolves.toMatchObject({ total: 1 });
    await expect(controller.findOne(TOOL_ID)).resolves.toBe(tool);
    await expect(controller.incrementDownload(TOOL_ID)).resolves.toBeUndefined();
    await expect(
      controller.createTool(
        { title: '7-Zip', description: 'Compresor', downloadUrl: 'https://www.7-zip.org' },
        req,
      ),
    ).resolves.toBe(tool);
    await expect(controller.replace(TOOL_ID, { version: 'v25' }, req)).resolves.toBe(tool);
    await expect(controller.update(TOOL_ID, { version: 'v25' }, req)).resolves.toBe(tool);
    await expect(controller.remove(TOOL_ID, req)).resolves.toEqual({ message: 'ok', id: TOOL_ID });
  });
});
