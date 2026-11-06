import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional({
    example: 'https://www.7-zip.org/download.html',
    description: 'Enlace de descarga',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'El enlace de descarga debe ser una URL válida' })
  downloadUrl?: string | null;

  @ApiPropertyOptional({
    example: '/catalogo/7zip.png',
    description: 'Imagen de la herramienta',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
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
