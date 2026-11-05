import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModDto {
  @ApiProperty({ example: 'Sodium', description: 'Nombre del mod' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del mod es obligatorio' })
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Mod de optimización gráfica de alto rendimiento.',
    description: 'Descripción e instrucciones de instalación del mod',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({ example: 'v0.5.8', description: 'Versión del mod' })
  @IsString()
  @IsNotEmpty({ message: 'La versión es obligatoria' })
  @MaxLength(50)
  version!: string;

  @ApiPropertyOptional({
    example: 'https://modrinth.com/mod/sodium',
    description: 'Enlace de descarga del archivo o repositorio',
  })
  @IsString()
  @IsNotEmpty({ message: 'El enlace de descarga es obligatorio' })
  @IsUrl({}, { message: 'El enlace de descarga debe ser una URL válida' })
  downloadUrl!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID del juego al que pertenece el mod',
  })
  @IsString()
  @IsNotEmpty({ message: 'El ID del juego es obligatorio' })
  gameId!: string;

  @ApiPropertyOptional({
    example: 'https://ejemplo.com/thumbnail.png',
    description: 'URL de la imagen previa del mod',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La miniatura debe ser una URL válida' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: '1.2 MB', description: 'Tamaño del archivo' })
  @IsOptional()
  @IsString()
  fileSize?: string;
}
