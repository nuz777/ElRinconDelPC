import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CATALOG_DOWNLOAD_HOSTS,
  MAX_DOWNLOAD_PARTS,
  type CatalogDownloadHost,
} from '../../Domain/Entities/download-host.js';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';

/** Acepta URLs http(s), rutas relativas del frontend (/img/...) o data URLs de imagen. */
const COVER_URL_PATTERN = /^(https?:\/\/\S+|\/\S*|data:image\/[a-z0-9.+-]+;base64,\S+)$/i;

export class CatalogMinimumRequirementsDto {
  @ApiProperty({ example: 'Windows 10 / 11 64-bit', description: 'Sistema Operativo (OS)' })
  @IsString()
  @IsNotEmpty({ message: 'El sistema operativo (OS) es obligatorio' })
  @MaxLength(150)
  os!: string;

  @ApiProperty({ example: 'Intel Core i5-8400 / Ryzen 5 2600', description: 'Procesador (CPU)' })
  @IsString()
  @IsNotEmpty({ message: 'El procesador es obligatorio' })
  @MaxLength(150)
  cpu!: string;

  @ApiProperty({ example: '8 GB RAM', description: 'Memoria RAM' })
  @IsString()
  @IsNotEmpty({ message: 'La memoria RAM es obligatoria' })
  @MaxLength(100)
  ram!: string;

  @ApiProperty({ example: '50 GB libres', description: 'Memoria ROM / Almacenamiento' })
  @IsString()
  @IsNotEmpty({ message: 'La memoria ROM (almacenamiento) es obligatoria' })
  @MaxLength(100)
  storage!: string;

  @ApiProperty({ example: 'NVIDIA GTX 1060 6GB / RX 580', description: 'Tarjeta Gráfica (GPU)' })
  @IsString()
  @IsNotEmpty({ message: 'La tarjeta gráfica es obligatoria' })
  @MaxLength(150)
  gpu!: string;
}

export class CatalogCoverFramingDto {
  @ApiProperty({ example: 50, description: 'Posición horizontal del encuadre (0-100 %)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  x!: number;

  @ApiProperty({ example: 50, description: 'Posición vertical del encuadre (0-100 %)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  y!: number;

  @ApiProperty({ example: 1, description: 'Zoom de la portada (1 = tamaño original, máx. 3)' })
  @IsNumber()
  @Min(1)
  @Max(3)
  scale!: number;
}

export class CreateCatalogItemDto {
  @ApiProperty({
    enum: CatalogSection,
    example: CatalogSection.JUEGOS,
    description: 'Apartado del catálogo',
  })
  @IsEnum(CatalogSection, {
    message: 'La sección debe ser JUEGOS, MODS, HERRAMIENTAS, ROMS o ADULTOS',
  })
  @IsNotEmpty()
  section!: CatalogSection;

  @ApiPropertyOptional({
    example: 'Nintendo',
    description: 'Solo ROMs (obligatorio): marca de la consola',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @ApiPropertyOptional({
    example: 'Nintendo 64',
    description: 'Solo ROMs (obligatorio): consola a la que pertenece la ROM',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  console?: string;

  @ApiPropertyOptional({
    example: 'Project64 / simple64',
    description: 'Solo ROMs: emulador recomendado',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emulator?: string;

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
    description: 'URL http(s), ruta relativa (/img/...) o data URL de imagen (portada vertical)',
  })
  @IsOptional()
  @IsString()
  @Matches(COVER_URL_PATTERN, {
    message: 'coverUrl debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  coverUrl?: string;

  @ApiPropertyOptional({
    type: CatalogCoverFramingDto,
    nullable: true,
    description: 'Encuadre de la portada en la card (posición y zoom)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CatalogCoverFramingDto)
  coverFraming?: CatalogCoverFramingDto | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/banners/elden-ring.webp',
    description: 'URL http(s), ruta relativa (/img/...) o data URL de imagen (banner horizontal)',
  })
  @IsOptional()
  @IsString()
  @Matches(COVER_URL_PATTERN, {
    message: 'bannerUrl debe ser una URL válida, una ruta relativa o una imagen en base64',
  })
  bannerUrl?: string;

  @ApiPropertyOptional({
    type: CatalogCoverFramingDto,
    nullable: true,
    description: 'Encuadre del banner de cabecera (posición y zoom)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CatalogCoverFramingDto)
  bannerFraming?: CatalogCoverFramingDto | null;

  @ApiPropertyOptional({
    type: [String],
    enum: CATALOG_DOWNLOAD_HOSTS,
    nullable: true,
    example: ['mediafire', 'mediafire'],
    description: 'Sitio de alojamiento de cada parte, en orden (1 elemento = 1 parte)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DOWNLOAD_PARTS)
  @IsIn(CATALOG_DOWNLOAD_HOSTS, { each: true, message: 'Medio de descarga no válido' })
  downloadHosts?: CatalogDownloadHost[] | null;

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
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'La descripción breve es obligatoria' })
  @MaxLength(2000)
  shortDescription!: string;

  @ApiPropertyOptional({
    type: CatalogMinimumRequirementsDto,
    description: 'Requisitos mínimos del sistema (OS, Procesador, Memoria RAM, Memoria ROM, Tarjeta Gráfica)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CatalogMinimumRequirementsDto)
  minimumRequirements?: CatalogMinimumRequirementsDto;
}
