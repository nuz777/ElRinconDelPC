import Anthropic from '@anthropic-ai/sdk';
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

const CLAUDE_MODEL = 'claude-3-5-haiku-latest';
const CLAUDE_TOOL_NAME = 'fill_game_metadata';

@Injectable()
export class ClaudeProvider implements AiProviderStrategy {
  async generateMetadata(
    apiKey: string,
    title: string,
    section?: string,
  ): Promise<AiAutocompleteResult> {
    try {
      const client = new Anthropic({
        apiKey,
        timeout: AI_PROVIDER_TIMEOUT_MS,
      });

      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        tools: [
          {
            name: CLAUDE_TOOL_NAME,
            description:
              'Rellena de forma estructurada los metadatos y requisitos técnicos de un elemento del catálogo.',
            input_schema: {
              type: 'object',
              properties: {
                genre: { type: 'string', description: METADATA_FIELD_SPECS.genre },
                tag: { type: 'string', description: METADATA_FIELD_SPECS.tag },
                size: { type: 'string', description: METADATA_FIELD_SPECS.size },
                version: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.version,
                },
                developer: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.developer,
                },
                description: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.description,
                },
                minCpu: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.minCpu,
                },
                minRam: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.minRam,
                },
                minStorage: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.minStorage,
                },
                minOs: { type: 'string', description: METADATA_FIELD_SPECS.minOs },
                minGpu: {
                  type: 'string',
                  description: METADATA_FIELD_SPECS.minGpu,
                },
              },
              required: [...METADATA_REQUIRED_KEYS],
            },
          },
        ],
        tool_choice: { type: 'tool', name: CLAUDE_TOOL_NAME },
        messages: [
          {
            role: 'user',
            content: buildAutocompletePrompt(title, section),
          },
        ],
      });

      const toolBlock = message.content.find(
        (block) => block.type === 'tool_use' && block.name === CLAUDE_TOOL_NAME,
      );

      if (!toolBlock || toolBlock.type !== 'tool_use') {
        throw new Error('Claude no devolvió el bloque tool_use esperado.');
      }

      return parseAndNormalizeMetadata(toolBlock.input);
    } catch (err) {
      mapProviderError('Claude', err);
    }
  }
}
