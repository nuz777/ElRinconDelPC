import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';
import type { CatalogFilters } from '../../Domain/interfaces/catalog.repository.interface.js';

export class FilterCatalogDto implements CatalogFilters {
  @ApiPropertyOptional({ enum: CatalogSection })
  @IsOptional()
  @IsEnum(CatalogSection, {
    message: 'La sección debe ser JUEGOS, MODS, HERRAMIENTAS, ROMS o ADULTOS',
  })
  section?: CatalogSection;

  @ApiPropertyOptional({ example: 'Acción / Shooter' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @ApiPropertyOptional({
    example: 'elden',
    description: 'Coincidencia parcial en título o desarrollador',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
