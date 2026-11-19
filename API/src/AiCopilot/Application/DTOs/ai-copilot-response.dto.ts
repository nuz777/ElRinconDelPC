import { ApiProperty } from '@nestjs/swagger';
import { AiProvider } from '../../Domain/ai-provider.enum.js';

export class AiConfigStatusResponseDto {
  @ApiProperty({ example: true })
  hasKey!: boolean;

  @ApiProperty({ enum: AiProvider, example: AiProvider.GEMINI })
  provider!: AiProvider;

  @ApiProperty({ example: 'AIzaSy••••9xQ', nullable: true })
  maskedKey!: string | null;
}

export class SaveAiConfigResponseDto {
  @ApiProperty({ example: 'API Key guardada' })
  message!: string;

  @ApiProperty({ enum: AiProvider, example: AiProvider.GEMINI })
  provider!: AiProvider;

  @ApiProperty({ example: 'AIzaSy••••9xQ' })
  maskedKey!: string;
}

export class DeleteAiConfigResponseDto {
  @ApiProperty({ example: 'API Key eliminada' })
  message!: string;

  @ApiProperty({ example: false })
  hasKey!: boolean;
}

export class AiAutocompleteResponseDto {
  @ApiProperty({ example: 'Aventura / RPG' })
  genre!: string;

  @ApiProperty({ example: 'Clásico' })
  tag!: string;

  @ApiProperty({ example: '9.0 GB' })
  size!: string;

  @ApiProperty({ example: 'v1.5.78' })
  version!: string;

  @ApiProperty({ example: 'Team Cherry' })
  developer!: string;

  @ApiProperty({
    example: 'Explora un vasto reino subterráneo interconectado en este metroidvania de acción.',
  })
  description!: string;

  @ApiProperty({ example: 'Intel Core 2 Duo E5200' })
  minCpu!: string;

  @ApiProperty({ example: '4 GB RAM' })
  minRam!: string;

  @ApiProperty({ example: '9 GB libres' })
  minStorage!: string;

  @ApiProperty({ example: 'Windows 10 64-bit' })
  minOs!: string;

  @ApiProperty({ example: 'GeForce 9800GTX+ (1GB)' })
  minGpu!: string;
}
