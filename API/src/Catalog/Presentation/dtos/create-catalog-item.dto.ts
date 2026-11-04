import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';

/** Acepta URLs http(s), rutas relativas del frontend (/img/...) o data URLs de imagen. */
const COVER_URL_PATTERN = /^(https?:\/\/\S+|\/\S*|data:image\/[a-z0-9.+-]+;base64,\S+)$/i;

export class CreateCatalogItemDto {
  @ApiProperty({
    enum: CatalogSection,
    example: CatalogSection.JUEGOS,
    description: 'Apartado del catálogo',
  })
  @IsEnum(CatalogSection, {
    message: 'La sección debe ser JUEGOS, MODS o HERRAMIENTAS',
  })
  @IsNotEmpty()
  section!: CatalogSection;

  @ApiProperty({ example: 'Elden Ring', maxLength: 150 })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'Aventura / RPG', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'El género es obligatorio' })
  @MaxLength(100)
  genre!: string;

  @ApiPropertyOptional({ example: '14.5 GB', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ example: 'v1.0', default: 'v1.0', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ example: 'Nuevo', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badge?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/covers/elden-ring.webp',
    description: 'URL http(s), ruta relativa (/img/...) o data URL de imagen',
  })
  @IsOptional()
  @IsString()
  @Matches(COVER_URL_PATTERN, {
    message: 'coverUrl debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'https://gofile.io/d/abc123' })
  @IsOptional()
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'downloadUrl debe ser una URL válida (http/https)' },
  )
  downloadUrl?: string;

  @ApiPropertyOptional({ example: 'FromSoftware', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  developer?: string;

  @ApiProperty({
    example: 'RPG de acción en mundo abierto ambientado en las Tierras Intermedias.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción breve es obligatoria' })
  @MaxLength(500)
  shortDescription!: string;
}
