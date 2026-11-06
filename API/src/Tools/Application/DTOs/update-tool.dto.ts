import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateToolDto } from './create-tool.dto.js';

/**
 * DTO para actualización parcial de una herramienta.
 * Todos los campos son opcionales.
 */
export class UpdateToolDto extends OmitType(PartialType(CreateToolDto), [] as const) {
  @ApiPropertyOptional({
    example: '7-zip-actualizado',
    description: 'Slug amigable para URL (se regenera si cambia el título)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;
}
