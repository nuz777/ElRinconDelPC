import { BadRequestException, Injectable } from '@nestjs/common';
import { AiProvider } from '../../Domain/ai-provider.enum.js';
import type { AiProviderStrategy } from '../../Domain/ai-provider-strategy.interface.js';
import { ClaudeProvider } from './claude.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { NvidiaProvider } from './nvidia.provider.js';

@Injectable()
export class AiProviderFactory {
  private readonly strategies: Record<AiProvider, AiProviderStrategy>;

  constructor(
    geminiProvider: GeminiProvider,
    nvidiaProvider: NvidiaProvider,
    claudeProvider: ClaudeProvider,
  ) {
    this.strategies = {
      [AiProvider.GEMINI]: geminiProvider,
      [AiProvider.NVIDIA]: nvidiaProvider,
      [AiProvider.CLAUDE]: claudeProvider,
    };
  }

  getProvider(provider: AiProvider): AiProviderStrategy {
    const strategy = this.strategies[provider];
    if (!strategy) {
      throw new BadRequestException(
        `Proveedor de IA no soportado: ${String(provider)}`,
      );
    }
    return strategy;
  }
}
