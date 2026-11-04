import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateToolDto {
  @ApiProperty({ example: '7-Zip', description: 'Nombre de la herramienta' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la herramienta es obligatorio' })
  @MaxLength(150)
  title!: string;

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
  category?: string;

  @ApiPropertyOptional({
    example: 'v24.08',
    description: 'Versión de la herramienta',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '1.6 MB', description: 'Tamaño del archivo' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: 'https://www.7-zip.org/download.html',
    description: 'Enlace de descarga',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({
    example: '/catalogo/7zip.png',
    description: 'Imagen de la herramienta',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['Windows', 'Compresión'],
    description: 'Etiquetas de la herramienta',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateToolDto {
  @ApiPropertyOptional({ example: '7-Zip ZS' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({
    example: 'Descripción actualizada de la herramienta',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Utilidades' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'v24.09' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '1.8 MB' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'https://www.7-zip.org/download.html' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ example: '/catalogo/7zip.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['Windows'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
