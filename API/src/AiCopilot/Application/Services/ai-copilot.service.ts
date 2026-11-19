import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionUtil, maskApiKey } from '../../../Common/utils/encryption.util.js';
import { AiProvider } from '../../Domain/ai-provider.enum.js';
import type { AiAutocompleteResult } from '../../Domain/ai-provider-strategy.interface.js';
import { AdminAiConfigTypeormEntity } from '../../Infraestructure/entities/admin-ai-config.typeorm-entity.js';
import { AiProviderFactory } from '../../Infraestructure/providers/ai-provider.factory.js';
import type {
  AiConfigStatusResponseDto,
  DeleteAiConfigResponseDto,
  SaveAiConfigResponseDto,
} from '../DTOs/ai-copilot-response.dto.js';
import type { AutocompleteGameDto } from '../DTOs/autocomplete-game.dto.js';
import type { UpdateAiConfigDto } from '../DTOs/update-ai-config.dto.js';

@Injectable()
export class AiCopilotService {
  private readonly logger = new Logger(AiCopilotService.name);

  constructor(
    @InjectRepository(AdminAiConfigTypeormEntity)
    private readonly configRepo: Repository<AdminAiConfigTypeormEntity>,
    private readonly encryptionUtil: EncryptionUtil,
    private readonly providerFactory: AiProviderFactory,
  ) {}

  /**
   * Consulta si el administrador ya tiene una API Key guardada sin exponer nunca el valor real.
   */
  async getConfig(userId: string): Promise<AiConfigStatusResponseDto> {
    const config = await this.configRepo.findOne({ where: { userId } });
    if (!config || !config.encryptedApiKey) {
      return {
        hasKey: false,
        provider: config?.provider ?? AiProvider.GEMINI,
        maskedKey: null,
      };
    }

    try {
      const decrypted = this.encryptionUtil.decrypt(config.encryptedApiKey);
      return {
        hasKey: true,
        provider: config.provider,
        maskedKey: maskApiKey(decrypted),
      };
    } catch {
      this.logger.warn(
        `No se pudo descifrar la API Key de Copiloto para userId=${userId}; se solicita reconfiguración.`,
      );
      return {
        hasKey: false,
        provider: config.provider,
        maskedKey: null,
      };
    }
  }

  /**
   * Cifra con AES-256-GCM y guarda o actualiza la API Key del administrador.
   */
  async saveConfig(
    userId: string,
    dto: UpdateAiConfigDto,
  ): Promise<SaveAiConfigResponseDto> {
    const trimmedKey = dto.apiKey.trim();
    if (!trimmedKey) {
      throw new BadRequestException('La API Key no puede estar vacía.');
    }

    const encryptedApiKey = this.encryptionUtil.encrypt(trimmedKey);
    const existing = await this.configRepo.findOne({ where: { userId } });

    if (existing) {
      existing.provider = dto.provider;
      existing.encryptedApiKey = encryptedApiKey;
      await this.configRepo.save(existing);
    } else {
      const created = this.configRepo.create({
        userId,
        provider: dto.provider,
        encryptedApiKey,
      });
      await this.configRepo.save(created);
    }

    return {
      message: 'API Key guardada',
      provider: dto.provider,
      maskedKey: maskApiKey(trimmedKey),
    };
  }

  /**
   * Elimina la API Key cifrada almacenada para el administrador.
   */
  async deleteConfig(userId: string): Promise<DeleteAiConfigResponseDto> {
    const existing = await this.configRepo.findOne({ where: { userId } });
    if (existing && existing.encryptedApiKey !== null) {
      existing.encryptedApiKey = null;
      await this.configRepo.save(existing);
    }

    return {
      message: 'API Key eliminada',
      hasKey: false,
    };
  }

  /**
   * Descifra la clave del admin en memoria y solicita los metadatos al proveedor elegido.
   */
  async autocomplete(
    userId: string,
    dto: AutocompleteGameDto,
  ): Promise<AiAutocompleteResult> {
    const config = await this.configRepo.findOne({ where: { userId } });
    if (!config || !config.encryptedApiKey) {
      throw new BadRequestException(
        'No tienes una API Key configurada. Configúrala para usar el Copiloto IA.',
      );
    }

    const decryptedKey = this.encryptionUtil.decrypt(config.encryptedApiKey);
    const strategy = this.providerFactory.getProvider(config.provider);
    return strategy.generateMetadata(decryptedKey, dto.title, dto.section);
  }
}
