/* oxlint-disable typescript/unbound-method */
import type { DataSource, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolTypeormEntity } from '../entities/tool.typeorm-entity.js';
import { TypeormToolRepository } from './tool.typeorm-repository.js';

const TOOL_ID = '22222222-3333-4444-5555-666666666666';
const AUTHOR_ID = '99999999-8888-7777-6666-555555555555';

const buildEntity = (override: Partial<ToolTypeormEntity> = {}): ToolTypeormEntity =>
  ({
    id: TOOL_ID,
    title: '7-Zip',
    slug: '7-zip',
    description: 'Compresor',
    category: 'Utilidades',
    version: 'v24.0',
    size: '1.5 MB',
    downloadUrl: 'https://www.7-zip.org',
    imageUrl: null,
    tags: ['compresor'],
    authorId: AUTHOR_ID,
    downloadsCount: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...override,
  }) as ToolTypeormEntity;

const buildToolRow = (override: Record<string, unknown> = {}) => ({
  id: TOOL_ID,
  title: '7-Zip',
  slug: '7-zip',
  description: 'Compresor',
  category: 'Utilidades',
  version: 'v24.0',
  size: '1.5 MB',
  download_url: 'https://www.7-zip.org',
  image_url: null,
  tags: ['compresor'],
  author_id: AUTHOR_ID,
  downloads_count: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...override,
});

describe('TypeormToolRepository (Unit)', () => {
  let repo: TypeormToolRepository;
  let dataSource: DataSource;
  let ormRepo: Repository<ToolTypeormEntity>;

  beforeEach(() => {
    dataSource = { query: vi.fn() } as unknown as DataSource;
    ormRepo = {
      create: vi.fn((e) => e as ToolTypeormEntity),
      save: vi.fn(async (e) => e as ToolTypeormEntity),
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn(),
      increment: vi.fn(),
    } as unknown as Repository<ToolTypeormEntity>;

    repo = new TypeormToolRepository(dataSource, ormRepo);
  });

  it('create, findById, findBySlug y slugExists funcionan correctamente', async () => {
    const entity = buildEntity();
    vi.mocked(ormRepo.save).mockResolvedValue(entity);
    const created = await repo.create({
      title: '7-Zip',
      slug: '7-zip',
      description: 'Compresor',
      category: 'Utilidades',
      version: 'v24.0',
      size: '1.5 MB',
      downloadUrl: 'https://www.7-zip.org',
      imageUrl: null,
      tags: ['compresor'],
      authorId: AUTHOR_ID,
    });
    expect(created.id).toBe(TOOL_ID);

    vi.mocked(ormRepo.findOne).mockResolvedValue(entity);
    await expect(repo.findById(TOOL_ID)).resolves.toMatchObject({ slug: '7-zip' });
    await expect(repo.findBySlug('7-zip')).resolves.toMatchObject({ id: TOOL_ID });
    await expect(repo.slugExists('7-zip', TOOL_ID)).resolves.toBe(false);
    await expect(repo.slugExists('7-zip', 'other-id')).resolves.toBe(true);
  });

  it('findAll ejecuta SELECT * y COUNT(*) en paralelo con búsqueda escapada', async () => {
    vi.mocked(dataSource.query)
      .mockResolvedValueOnce([buildToolRow()])
      .mockResolvedValueOnce([{ count: '1' }]);

    const result = await repo.findAll({
      search: '7%_zip',
      category: 'Utilidades',
      isActive: true,
      page: 1,
      limit: 10,
    });

    expect(dataSource.query).toHaveBeenCalledTimes(2);
    expect(vi.mocked(dataSource.query).mock.calls[0][1]).toContain('%7\\%\\_zip%');
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe('7-Zip');
  });

  it('update, delete, hardDelete e incrementDownloadsIfExists ejecutan UPDATE directo', async () => {
    vi.mocked(dataSource.query)
      .mockResolvedValueOnce([buildToolRow({ version: 'v25.0' })])
      .mockResolvedValueOnce([{ id: TOOL_ID }]);
    vi.mocked(ormRepo.delete).mockResolvedValue({ raw: [], affected: 1 });

    await expect(repo.update(TOOL_ID, { version: 'v25.0' })).resolves.toMatchObject({
      version: 'v25.0',
    });
    expect(ormRepo.findOne).not.toHaveBeenCalled();

    await expect(repo.delete(TOOL_ID)).resolves.toBe(true);
    await expect(repo.hardDelete(TOOL_ID)).resolves.toBe(true);

    await expect(repo.incrementDownloadsIfExists(TOOL_ID)).resolves.toBe(true);
    await repo.incrementDownloads(TOOL_ID);
    expect(ormRepo.increment).toHaveBeenCalledWith({ id: TOOL_ID }, 'downloadsCount', 1);
  });
});
