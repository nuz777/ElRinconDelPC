import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { Injectable } from '@nestjs/common';
import type {
  AiAutocompleteResult,
  AiProviderStrategy,
} from '../../Domain/ai-provider-strategy.interface.js';
import {
  AI_PROVIDER_TIMEOUT_MS,
  buildAutocompletePrompt,
  mapProviderError,
  METADATA_FIELD_SPECS,
  METADATA_REQUIRED_KEYS,
  parseAndNormalizeMetadata,
} from './ai-provider.shared.js';

const GEMINI_MODEL = 'gemini-2.5-flash';

const GEMINI_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    genre: { type: Type.STRING, description: METADATA_FIELD_SPECS.genre },
    tag: { type: Type.STRING, description: METADATA_FIELD_SPECS.tag },
    size: { type: Type.STRING, description: METADATA_FIELD_SPECS.size },
    version: { type: Type.STRING, description: METADATA_FIELD_SPECS.version },
    developer: { type: Type.STRING, description: METADATA_FIELD_SPECS.developer },
    description: {
      type: Type.STRING,
      description: METADATA_FIELD_SPECS.description,
    },
    minCpu: { type: Type.STRING, description: METADATA_FIELD_SPECS.minCpu },
    minRam: { type: Type.STRING, description: METADATA_FIELD_SPECS.minRam },
    minStorage: {
      type: Type.STRING,
      description: METADATA_FIELD_SPECS.minStorage,
    },
    minOs: { type: Type.STRING, description: METADATA_FIELD_SPECS.minOs },
    minGpu: { type: Type.STRING, description: METADATA_FIELD_SPECS.minGpu },
  },
  required: [...METADATA_REQUIRED_KEYS],
};

@Injectable()
export class GeminiProvider implements AiProviderStrategy {
  async generateMetadata(
    apiKey: string,
    title: string,
    section?: string,
  ): Promise<AiAutocompleteResult> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildAutocompletePrompt(title, section),
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          abortSignal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Respuesta vacía de Gemini.');
      }

      return parseAndNormalizeMetadata(text);
    } catch (err) {
      mapProviderError('Gemini', err);
    }
  }
}
