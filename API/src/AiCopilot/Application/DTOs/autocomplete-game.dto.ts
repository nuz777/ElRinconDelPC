import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AutocompleteGameDto {
  @ApiProperty({
    example: 'Hollow Knight',
    description: 'Título del juego, mod, herramienta o ROM a autocompletar',
    maxLength: 150,
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio para autocompletar' })
  @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
  title!: string;

  @ApiPropertyOptional({
    example: 'JUEGOS',
    description: 'Apartado del catálogo para adaptar género y requisitos',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  section?: string;
}
