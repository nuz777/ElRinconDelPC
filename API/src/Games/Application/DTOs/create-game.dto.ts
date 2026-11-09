import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Acepta URLs http(s), rutas relativas (/catalogo/..., /img/...) o data URLs de imagen. */
const IMAGE_URL_PATTERN =
  /^(https?:\/\/\S+|\/\S*|data:image\/[a-z0-9.+-]+;base64,\S+)$/i;

export class MinimumRequirementsDto {
  @ApiProperty({ example: 'Windows 10 64-bit', description: 'Sistema operativo mínimo' })
  @IsString()
  @IsNotEmpty()
  os!: string;

  @ApiProperty({ example: '50 GB', description: 'Almacenamiento mínimo (ROM)' })
  @IsString()
  @IsNotEmpty()
  storage!: string;

  @ApiProperty({ example: '8 GB', description: 'Memoria RAM mínima' })
  @IsString()
  @IsNotEmpty()
  ram!: string;

  @ApiProperty({ example: 'Intel Core i5', description: 'Procesador mínimo' })
  @IsString()
  @IsNotEmpty()
  cpu!: string;

  @ApiProperty({ example: 'NVIDIA GTX 1060', description: 'Tarjeta gráfica mínima' })
  @IsString()
  @IsNotEmpty()
  gpu!: string;
}

export class CreateGameDto {
  @ApiProperty({ example: 'Hollow Knight', description: 'Título del juego' })
  @IsString()
  @IsNotEmpty({ message: 'El título del juego es obligatorio' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'hollow-knight',
    description: 'Slug amigable para URL (se genera automáticamente si se omite)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiProperty({
    example: 'Aventura de acción clásica en 2D ambientada en Hallownest.',
    description: 'Descripción del juego',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Precio del juego en moneda local' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;

  @ApiPropertyOptional({ example: 0, description: 'Precio con descuento (opcional)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El precio con descuento no puede ser negativo' })
  discountPrice?: number | null;

  @ApiProperty({ example: 100, description: 'Cantidad de licencias o claves disponibles' })
  @IsNumber()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock!: number;

  @ApiPropertyOptional({
    example: ['Indie', 'Metroidvania'],
    description: 'Géneros del juego',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiProperty({
    example: 'https://ejemplo.com/portada.jpg',
    description: 'URL http(s), ruta relativa o imagen en base64 de la portada',
  })
  @IsString()
  @IsNotEmpty({ message: 'La imagen de portada es obligatoria' })
  @Matches(IMAGE_URL_PATTERN, {
    message: 'La portada debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  coverImage!: string;

  @ApiPropertyOptional({
    example: 'https://ejemplo.com/banner.jpg',
    description: 'URL http(s), ruta relativa o imagen en base64 del banner promocional',
  })
  @IsOptional()
  @IsString()
  @Matches(IMAGE_URL_PATTERN, {
    message: 'El banner debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  bannerImage?: string;

  @ApiProperty({ example: 'Team Cherry', description: 'Desarrollador del juego' })
  @IsString()
  @IsNotEmpty({ message: 'El desarrollador es obligatorio' })
  @MaxLength(150)
  developer!: string;

  @ApiProperty({ example: 'Team Cherry', description: 'Editor del juego' })
  @IsString()
  @IsNotEmpty({ message: 'El editor es obligatorio' })
  @MaxLength(150)
  publisher!: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Fecha de lanzamiento (formato ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el juego está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: MinimumRequirementsDto, description: 'Requisitos mínimos del sistema' })
  @IsNotEmpty({ message: 'Los requisitos mínimos son obligatorios' })
  @ValidateNested()
  @Type(() => MinimumRequirementsDto)
  minimumRequirements!: MinimumRequirementsDto;
}
