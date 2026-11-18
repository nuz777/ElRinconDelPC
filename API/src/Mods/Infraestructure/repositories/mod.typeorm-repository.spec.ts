/* oxlint-disable typescript/unbound-method */
import { IsNull, type DataSource, type Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModTypeormEntity } from '../entities/mod.typeorm-entity.js';
import { TypeormModRepository } from './mod.typeorm-repository.js';

const MOD_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const GAME_ID = '11111111-2222-3333-4444-555555555555';
const AUTHOR_ID = '99999999-8888-7777-6666-555555555555';

const buildEntity = (override: Partial<ModTypeormEntity> = {}): ModTypeormEntity =>
  ({
    id: MOD_ID,
    title: 'Sodium',
    slug: 'sodium',
    description: 'Mod de optimización',
    version: 'v0.5.8',
    downloadUrl: 'https://modrinth.com/mod/sodium',
    fileSize: '2 MB',
    thumbnailUrl: null,
    gameId: GAME_ID,
    authorId: AUTHOR_ID,
    downloadsCount: 10,
    isApproved: false,
    isActive: true,
    minOs: 'Windows 10',
    minStorage: '1 GB',
    minRam: '4 GB',
    minCpu: 'i3',
    minGpu: 'Intel HD',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...override,
  }) as ModTypeormEntity;

const buildModRow = (override: Record<string, unknown> = {}) => ({
  id: MOD_ID,
  title: 'Sodium',
  slug: 'sodium',
  description: 'Mod de optimización',
  version: 'v0.5.8',
  download_url: 'https://modrinth.com/mod/sodium',
  file_size: '2 MB',
  thumbnail_url: null,
  game_id: GAME_ID,
  author_id: AUTHOR_ID,
  downloads_count: 10,
  is_approved: true,
  is_active: true,
  min_os: 'Windows 10',
  min_storage: '1 GB',
  min_ram: '4 GB',
  min_cpu: 'i3',
  min_gpu: 'Intel HD',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...override,
});

describe('TypeormModRepository (Unit)', () => {
  let repo: TypeormModRepository;
  let dataSource: DataSource;
  let ormRepo: Repository<ModTypeormEntity>;

  beforeEach(() => {
    dataSource = {
      query: vi.fn(),
    } as unknown as DataSource;

    ormRepo = {
      create: vi.fn((e) => e as ModTypeormEntity),
      save: vi.fn(async (e) => e as ModTypeormEntity),
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn(),
      increment: vi.fn(),
    } as unknown as Repository<ModTypeormEntity>;

    repo = new TypeormModRepository(dataSource, ormRepo);
  });

  it('create y findBySlug (con gameId null usa IsNull())', async () => {
    vi.mocked(ormRepo.save).mockResolvedValue(buildEntity());
    const created = await repo.create({
      title: 'Sodium',
      slug: 'sodium',
      description: 'Desc',
      version: 'v1.0',
      downloadUrl: 'https://example.com',
      authorId: AUTHOR_ID,
      gameId: null,
    });
    expect(created.id).toBe(MOD_ID);

    vi.mocked(ormRepo.findOne).mockResolvedValue(buildEntity({ gameId: null }));
    await repo.findBySlug('sodium', null);
    expect(ormRepo.findOne).toHaveBeenCalledWith({
      where: { slug: 'sodium', gameId: IsNull() },
    });
  });

  it('findByGameId ejecuta SELECT * y COUNT(*) en paralelo y escapa LIKE', async () => {
    vi.mocked(dataSource.query)
      .mockResolvedValueOnce([buildModRow()])
      .mockResolvedValueOnce([{ count: '1' }]);

    const result = await repo.findByGameId(GAME_ID, {
      isApproved: true,
      isActive: true,
      search: 'opt%_',
      page: 1,
      limit: 10,
    });

    expect(dataSource.query).toHaveBeenCalledTimes(2);
    const [, params] = vi.mocked(dataSource.query).mock.calls[0];
    expect(params).toContain('%opt\\%\\_%');
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe('Sodium');
  });

  it('update, delete, approve y approveAndReturn ejecutan UPDATE directo sin findOne previo', async () => {
    vi.mocked(dataSource.query)
      .mockResolvedValueOnce([buildModRow({ version: 'v2.0' })])
      .mockResolvedValueOnce([buildModRow({ is_approved: true })]);

    const updated = await repo.update(MOD_ID, { version: 'v2.0' });
    expect(ormRepo.findOne).not.toHaveBeenCalled();
    expect(updated?.version).toBe('v2.0');

    await expect(repo.delete(MOD_ID)).resolves.toBe(true);
    await expect(repo.approve(MOD_ID)).resolves.toBe(true);
    expect(ormRepo.update).toHaveBeenCalledTimes(2);

    const approved = await repo.approveAndReturn(MOD_ID);
    expect(approved?.isApproved).toBe(true);
  });

  it('hardDelete, incrementDownloads e incrementAndGetDownloadUrl (1 query)', async () => {
    vi.mocked(ormRepo.delete).mockResolvedValue({ raw: [], affected: 1 });
    await expect(repo.hardDelete(MOD_ID)).resolves.toBe(true);

    await repo.incrementDownloads(MOD_ID);
    expect(ormRepo.increment).toHaveBeenCalledWith({ id: MOD_ID }, 'downloadsCount', 1);

    vi.mocked(dataSource.query).mockResolvedValueOnce([
      { download_url: 'https://modrinth.com/mod/sodium' },
    ]);
    await expect(repo.incrementAndGetDownloadUrl(MOD_ID)).resolves.toBe(
      'https://modrinth.com/mod/sodium',
    );
  });

  it('gameExists usa SELECT 1 ... LIMIT 1 y valida UUID antes de consultar', async () => {
    await expect(repo.gameExists('no-uuid')).resolves.toBe(false);
    expect(dataSource.query).not.toHaveBeenCalled();

    vi.mocked(dataSource.query).mockResolvedValueOnce([{ '?column?': 1 }]);
    await expect(repo.gameExists(GAME_ID)).resolves.toBe(true);
    expect(vi.mocked(dataSource.query).mock.calls[0][0]).toContain(
      'SELECT 1 FROM games WHERE id = $1 LIMIT 1',
    );
  });

  it('findDetailsById resuelve mod + juego en una única consulta con LEFT JOIN', async () => {
    vi.mocked(dataSource.query).mockResolvedValueOnce([
      buildModRow({ game_title: 'Minecraft' }),
    ]);

    const details = await repo.findDetailsById(MOD_ID);

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(vi.mocked(dataSource.query).mock.calls[0][0]).toContain('LEFT JOIN games');
    expect(details?.game).toEqual({ id: GAME_ID, title: 'Minecraft' });
    expect(details?.author).toEqual({ id: AUTHOR_ID });
  });
});
