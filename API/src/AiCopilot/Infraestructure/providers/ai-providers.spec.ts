/* oxlint-disable typescript/unbound-method */
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiProvider } from '../../Domain/ai-provider.enum.js';
import { AiProviderFactory } from './ai-provider.factory.js';
import {
  mapProviderError,
  parseAndNormalizeMetadata,
} from './ai-provider.shared.js';
import { ClaudeProvider } from './claude.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { NvidiaProvider } from './nvidia.provider.js';

const mockGeminiGenerate = vi.fn();
const mockOpenAiCreate = vi.fn();
const mockAnthropicCreate = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: mockGeminiGenerate,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
  };
});

vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockOpenAiCreate,
      },
    };
  }
  return { default: MockOpenAI };
});

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: mockAnthropicCreate,
    };
  }
  return { default: MockAnthropic };
});

const SAMPLE_METADATA = {
  genre: 'Aventura / RPG',
  tag: 'Clásico',
  size: '9.0 GB',
  version: 'v1.5.78',
  developer: 'Team Cherry',
  description: 'Explora Hallownest en un metroidvania desafiante.',
  minCpu: 'Intel Core 2 Duo E5200',
  minRam: '4 GB RAM',
  minStorage: '9 GB libres',
  minOs: 'Windows 10 64-bit',
  minGpu: 'GeForce 9800GTX+ (1GB)',
};

describe('AiProviders & AiProviderFactory (Unit)', () => {
  let gemini: GeminiProvider;
  let nvidia: NvidiaProvider;
  let claude: ClaudeProvider;
  let factory: AiProviderFactory;

  beforeEach(() => {
    vi.clearAllMocks();
    gemini = new GeminiProvider();
    nvidia = new NvidiaProvider();
    claude = new ClaudeProvider();
    factory = new AiProviderFactory(gemini, nvidia, claude);
  });

  it('factory resuelve la estrategia correcta por proveedor y rechaza desconocidos', () => {
    expect(factory.getProvider(AiProvider.GEMINI)).toBe(gemini);
    expect(factory.getProvider(AiProvider.NVIDIA)).toBe(nvidia);
    expect(factory.getProvider(AiProvider.CLAUDE)).toBe(claude);
    expect(() =>
      factory.getProvider('unknown' as AiProvider),
    ).toThrowError(BadRequestException);
  });

  it('GeminiProvider consulta gemini-2.5-flash con responseSchema y normaliza JSON', async () => {
    mockGeminiGenerate.mockResolvedValue({
      text: JSON.stringify(SAMPLE_METADATA),
    });

    const result = await gemini.generateMetadata(
      'AIzaSy-test',
      'Hollow Knight',
      'JUEGOS',
    );

    expect(mockGeminiGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
        }),
      }),
    );
    expect(result).toEqual(SAMPLE_METADATA);
  });

  it('NvidiaProvider consulta meta/llama-3.3-70b-instruct con json_object', async () => {
    mockOpenAiCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(SAMPLE_METADATA) } }],
    });

    const result = await nvidia.generateMetadata(
      'nvapi-test',
      'Hollow Knight',
    );

    expect(mockOpenAiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'meta/llama-3.3-70b-instruct',
        response_format: { type: 'json_object' },
      }),
    );
    expect(result).toEqual(SAMPLE_METADATA);
  });

  it('ClaudeProvider consulta claude-3-5-haiku-latest forzando tool_use', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'fill_game_metadata',
          input: SAMPLE_METADATA,
        },
      ],
    });

    const result = await claude.generateMetadata(
      'sk-ant-test',
      'Hollow Knight',
    );

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-haiku-latest',
        tool_choice: { type: 'tool', name: 'fill_game_metadata' },
      }),
    );
    expect(result).toEqual(SAMPLE_METADATA);
  });

  it('parseAndNormalizeMetadata limpia bloques markdown y completa faltantes con defaults seguros', () => {
    const parsed = parseAndNormalizeMetadata(
      '```json\n{"genre":"Acción","developer":"Valve"}\n```',
    );
    expect(parsed.genre).toBe('Acción');
    expect(parsed.developer).toBe('Valve');
    expect(parsed.minOs).toBe('Windows 10 / 11 64-bit');
  });

  it('mapProviderError traduce 401/403 y 429 sin filtrar credenciales', () => {
    expect(() =>
      mapProviderError('Gemini', { status: 401, message: 'API_KEY_INVALID' }),
    ).toThrowError(HttpException);

    try {
      mapProviderError('Gemini', { status: 401, message: 'API_KEY_INVALID' });
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    }

    try {
      mapProviderError('NVIDIA', { status: 429, message: 'Rate limit exceeded' });
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    expect(() =>
      mapProviderError('Claude', new Error('Network socket hang up')),
    ).toThrowError(BadGatewayException);
  });
});
