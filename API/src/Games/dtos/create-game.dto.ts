import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGameDto {
  @ApiProperty({ example: 'Hollow Knight', description: 'Título del juego' })
  @IsString()
  @IsNotEmpty({ message: 'El título del juego es obligatorio' })
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example: 'Aventura de acción clásica en 2D ambientada en Hallownest.',
    description: 'Descripción del juego',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({ example: 'v1.5.78', description: 'Versión del juego' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '7.5 GB', description: 'Tamaño de descarga' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: 'https://gofile.io/d/example',
    description: 'Enlace de descarga',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({
    example: '/catalogo/hollow-knight.png',
    description: 'Imagen o portada del juego',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['Indie', 'Metroidvania'],
    description: 'Etiquetas del juego',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateGameDto {
  @ApiPropertyOptional({ example: 'Hollow Knight Silksong' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada del juego' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'v1.6.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '8.0 GB' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'https://gofile.io/d/example' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ example: '/catalogo/hollow-knight.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['Indie', 'Acción'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
