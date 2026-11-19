import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type {
  AiAutocompleteResult,
  AiProviderStrategy,
} from '../../Domain/ai-provider-strategy.interface.js';
import {
  AI_PROVIDER_TIMEOUT_MS,
  buildAutocompletePrompt,
  mapProviderError,
  parseAndNormalizeMetadata,
} from './ai-provider.shared.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';

@Injectable()
export class NvidiaProvider implements AiProviderStrategy {
  async generateMetadata(
    apiKey: string,
    title: string,
    section?: string,
  ): Promise<AiAutocompleteResult> {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL: NVIDIA_BASE_URL,
        timeout: AI_PROVIDER_TIMEOUT_MS,
      });

      const completion = await client.chat.completions.create({
        model: NVIDIA_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente catalogador de videojuegos y software para PC. Respondes únicamente con JSON válido.',
          },
          {
            role: 'user',
            content: buildAutocompletePrompt(title, section),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Respuesta vacía de NVIDIA NIM.');
      }

      return parseAndNormalizeMetadata(content);
    } catch (err) {
      mapProviderError('NVIDIA', err);
    }
  }
}
