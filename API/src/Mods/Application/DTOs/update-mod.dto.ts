import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateModDto } from './create-mod.dto.js';

/**
 * DTO para actualización parcial de un mod.
 * Todos los campos son opcionales excepto `gameId`, que se omite intencionalmente
 * para evitar cambiar el juego al que pertenece un mod existente.
 */
export class UpdateModDto extends OmitType(PartialType(CreateModDto), [
  'gameId',
] as const) {
  @ApiPropertyOptional({
    example: 'mi-mod-actualizado',
    description: 'Slug amigable para URL (se regenera si cambia el título)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;
}
