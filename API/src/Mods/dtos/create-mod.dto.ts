import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateModDto {
  @ApiProperty({ example: 'Sodium', description: 'Nombre del mod' })
  @IsString()
  @IsNotEmpty({ message: 'El título del mod es obligatorio' })
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example: 'Mod de optimización gráfica de alto rendimiento para Minecraft.',
    description: 'Descripción del mod',
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiPropertyOptional({ example: 'Minecraft', description: 'Juego base' })
  @IsOptional()
  @IsString()
  game?: string;

  @ApiPropertyOptional({ example: 'v0.5.8', description: 'Versión del mod' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '1.2 MB', description: 'Tamaño del archivo' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    example: 'https://modrinth.com/mod/sodium',
    description: 'Enlace de descarga',
  })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({
    example: '/catalogo/sodium.png',
    description: 'Imagen del mod',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['Optimización', 'FPS'],
    description: 'Etiquetas del mod',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateModDto {
  @ApiPropertyOptional({ example: 'Sodium Extra' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada del mod' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Minecraft' })
  @IsOptional()
  @IsString()
  game?: string;

  @ApiPropertyOptional({ example: 'v0.6.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: '1.5 MB' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'https://modrinth.com/mod/sodium' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ example: '/catalogo/sodium.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ['Optimización'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
