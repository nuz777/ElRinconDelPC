import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionUtil } from '../Common/utils/encryption.util.js';
import { AiCopilotService } from './Application/Services/ai-copilot.service.js';
import { AdminAiConfigTypeormEntity } from './Infraestructure/entities/admin-ai-config.typeorm-entity.js';
import { AiProviderFactory } from './Infraestructure/providers/ai-provider.factory.js';
import { ClaudeProvider } from './Infraestructure/providers/claude.provider.js';
import { GeminiProvider } from './Infraestructure/providers/gemini.provider.js';
import { NvidiaProvider } from './Infraestructure/providers/nvidia.provider.js';
import { AiCopilotController } from './Presentation/ai-copilot.controller.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminAiConfigTypeormEntity]),
  ],
  controllers: [AiCopilotController],
  providers: [
    EncryptionUtil,
    GeminiProvider,
    NvidiaProvider,
    ClaudeProvider,
    AiProviderFactory,
    AiCopilotService,
  ],
  exports: [AiCopilotService],
})
export class AiCopilotModule {}
