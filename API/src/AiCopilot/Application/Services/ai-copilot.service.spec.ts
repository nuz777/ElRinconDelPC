/* oxlint-disable typescript/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Repository } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionUtil } from '../../../Common/utils/encryption.util.js';
import { AiProvider } from '../../Domain/ai-provider.enum.js';
import type { AiAutocompleteResult } from '../../Domain/ai-provider-strategy.interface.js';
import type { AdminAiConfigTypeormEntity } from '../../Infraestructure/entities/admin-ai-config.typeorm-entity.js';
import type { AiProviderFactory } from '../../Infraestructure/providers/ai-provider.factory.js';
import { AiCopilotService } from './ai-copilot.service.js';

const ADMIN_ID = '11111111-2222-3333-4444-555555555555';

describe('AiCopilotService (Unit)', () => {
  const originalEnvKey = process.env.ENCRYPTION_SECRET_KEY;
  let configRepo: Repository<AdminAiConfigTypeormEntity>;
  let encryptionUtil: EncryptionUtil;
  let providerFactory: AiProviderFactory;
  let service: AiCopilotService;

  beforeEach(() => {
    process.env.ENCRYPTION_SECRET_KEY = randomBytes(32).toString('hex');
    configRepo = {
      findOne: vi.fn(),
      create: vi.fn((data: Partial<AdminAiConfigTypeormEntity>) => data),
      save: vi.fn((entity: AdminAiConfigTypeormEntity) =>
        Promise.resolve(entity),
      ),
    } as unknown as Repository<AdminAiConfigTypeormEntity>;

    encryptionUtil = new EncryptionUtil();
    providerFactory = {
      getProvider: vi.fn(),
    } as unknown as AiProviderFactory;

    service = new AiCopilotService(configRepo, encryptionUtil, providerFactory);
  });

  afterEach(() => {
    if (originalEnvKey === undefined) {
      delete process.env.ENCRYPTION_SECRET_KEY;
    } else {
      process.env.ENCRYPTION_SECRET_KEY = originalEnvKey;
    }
  });

  it('getConfig devuelve hasKey: false cuando el admin aún no configuró clave', async () => {
    vi.mocked(configRepo.findOne).mockResolvedValue(null);

    await expect(service.getConfig(ADMIN_ID)).resolves.toEqual({
      hasKey: false,
      provider: AiProvider.GEMINI,
      maskedKey: null,
    });
  });

  it('saveConfig cifra con AES-256-GCM antes de persistir y nunca devuelve la clave real', async () => {
    vi.mocked(configRepo.findOne).mockResolvedValue(null);
    const plainKey = 'AIzaSyTestSecretKey9xQ';

    const res = await service.saveConfig(ADMIN_ID, {
      provider: AiProvider.GEMINI,
      apiKey: `  ${plainKey}  `,
    });

    expect(res).toEqual({
      message: 'API Key guardada',
      provider: AiProvider.GEMINI,
      maskedKey: 'AIzaSy••••9xQ',
    });

    const savedArg = vi.mocked(configRepo.save).mock.calls[0][0];
    expect(savedArg.userId).toBe(ADMIN_ID);
    expect(savedArg.encryptedApiKey).not.toBe(plainKey);
    expect(encryptionUtil.decrypt(savedArg.encryptedApiKey!)).toBe(plainKey);
  });

  it('getConfig descifra en memoria solo para enmascarar la clave guardada', async () => {
    const encryptedApiKey = encryptionUtil.encrypt('nvapi-super-secret-777');
    vi.mocked(configRepo.findOne).mockResolvedValue({
      id: 'cfg-1',
      userId: ADMIN_ID,
      provider: AiProvider.NVIDIA,
      encryptedApiKey,
      updatedAt: new Date(),
    });

    const status = await service.getConfig(ADMIN_ID);

    expect(status).toEqual({
      hasKey: true,
      provider: AiProvider.NVIDIA,
      maskedKey: 'nvapi-••••777',
    });
    expect(JSON.stringify(status)).not.toContain('super-secret');
  });

  it('deleteConfig limpia encryptedApiKey en base de datos', async () => {
    const existing = {
      id: 'cfg-1',
      userId: ADMIN_ID,
      provider: AiProvider.CLAUDE,
      encryptedApiKey: encryptionUtil.encrypt('sk-ant-123456'),
      updatedAt: new Date(),
    };
    vi.mocked(configRepo.findOne).mockResolvedValue(existing);

    const res = await service.deleteConfig(ADMIN_ID);

    expect(res).toEqual({ message: 'API Key eliminada', hasKey: false });
    expect(existing.encryptedApiKey).toBeNull();
    expect(configRepo.save).toHaveBeenCalledWith(existing);
  });

  it('autocomplete lanza BadRequestException si el admin no tiene clave guardada', async () => {
    vi.mocked(configRepo.findOne).mockResolvedValue(null);

    await expect(
      service.autocomplete(ADMIN_ID, { title: 'Elden Ring' }),
    ).rejects.toThrowError(BadRequestException);
  });

  it('autocomplete descifra la clave en memoria y delega al proveedor seleccionado', async () => {
    const plainKey = 'sk-ant-real-key-999';
    vi.mocked(configRepo.findOne).mockResolvedValue({
      id: 'cfg-1',
      userId: ADMIN_ID,
      provider: AiProvider.CLAUDE,
      encryptedApiKey: encryptionUtil.encrypt(plainKey),
      updatedAt: new Date(),
    });

    const expected: AiAutocompleteResult = {
      genre: 'Aventura / RPG',
      tag: 'Popular',
      size: '60 GB',
      version: 'v1.12',
      developer: 'FromSoftware',
      description: 'ARPG de mundo abierto.',
      minCpu: 'Intel Core i5-8400',
      minRam: '12 GB RAM',
      minStorage: '60 GB libres',
      minOs: 'Windows 10 64-bit',
      minGpu: 'NVIDIA GTX 1060 3GB',
    };
    const generateMetadata = vi.fn().mockResolvedValue(expected);
    vi.mocked(providerFactory.getProvider).mockReturnValue({
      generateMetadata,
    });

    const result = await service.autocomplete(ADMIN_ID, {
      title: 'Elden Ring',
      section: 'JUEGOS',
    });

    expect(providerFactory.getProvider).toHaveBeenCalledWith(AiProvider.CLAUDE);
    expect(generateMetadata).toHaveBeenCalledWith(
      plainKey,
      'Elden Ring',
      'JUEGOS',
    );
    expect(result).toEqual(expected);
  });
});
