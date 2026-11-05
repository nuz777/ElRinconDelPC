import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

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

  @ApiProperty({ example: 19.99, description: 'Precio del juego' })
  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  price!: number;

  @ApiPropertyOptional({ example: 14.99, description: 'Precio con descuento aplicado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

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
    description: 'URL de la imagen de portada',
  })
  @IsString()
  @IsNotEmpty({ message: 'La imagen de portada es obligatoria' })
  @IsUrl({}, { message: 'La portada debe ser una URL válida' })
  coverImage!: string;

  @ApiPropertyOptional({
    example: 'https://ejemplo.com/banner.jpg',
    description: 'URL del banner promocional',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'El banner debe ser una URL válida' })
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
}
