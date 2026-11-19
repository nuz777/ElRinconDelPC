import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AiProvider } from '../../Domain/ai-provider.enum.js';

export class UpdateAiConfigDto {
  @ApiProperty({
    enum: AiProvider,
    example: AiProvider.GEMINI,
    description: 'Proveedor de IA elegido por el administrador',
  })
  @IsEnum(AiProvider, {
    message: 'El proveedor debe ser gemini, claude o nvidia',
  })
  @IsNotEmpty()
  provider!: AiProvider;

  @ApiProperty({
    example: 'AIzaSy...9xQ',
    description: 'API Key personal del administrador (se cifra con AES-256-GCM)',
    maxLength: 500,
  })
  @IsString({ message: 'La API Key debe ser texto' })
  @IsNotEmpty({ message: 'La API Key es obligatoria' })
  @MaxLength(500, { message: 'La API Key excede el límite de 500 caracteres' })
  apiKey!: string;
}
