import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

/** Acepta URLs http(s), rutas relativas (/catalogo/..., /img/...) o data URLs de imagen. */
const IMAGE_URL_PATTERN =
  /^(https?:\/\/\S+|\/\S*|data:image\/[a-z0-9.+-]+;base64,\S+)$/i;

export class CreateToolDto {
  @ApiProperty({ example: '7-Zip', description: 'Nombre de la herramienta' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la herramienta es obligatorio' })
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({
    example: '7-zip',
    description: 'Slug amigable para URL (se genera automáticamente si se omite)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiProperty({
    example: 'Compresor y descompresor de archivos libre y de código abierto.',
    description: 'Descripción de la herramienta',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({
    example: 'Utilidades',
    description: 'Categoría de la herramienta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    example: 'v24.08',
    description: 'Versión de la herramienta',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ example: '1.6 MB', description: 'Tamaño del archivo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiProperty({
    example: 'https://www.7-zip.org/download.html',
    description: 'Enlace de descarga de la herramienta',
  })
  @IsString()
  @IsNotEmpty({ message: 'El enlace de descarga es obligatorio' })
  @IsUrl({}, { message: 'El enlace de descarga debe ser una URL válida' })
  downloadUrl!: string;

  @ApiPropertyOptional({
    example: '/catalogo/7zip.png',
    description: 'URL http(s), ruta relativa (/img/...) o data URL de imagen',
  })
  @IsOptional()
  @IsString()
  @Matches(IMAGE_URL_PATTERN, {
    message:
      'imageUrl debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: ['Windows', 'Compresión'],
    description: 'Etiquetas de la herramienta',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
