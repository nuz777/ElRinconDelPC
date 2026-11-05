import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FilterGamesDto {
  @ApiPropertyOptional({ example: 1, description: 'Página actual' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Elementos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'hollow',
    description: 'Búsqueda por título, desarrollador o editor',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Indie', description: 'Filtrar por género' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ example: 0, description: 'Precio mínimo (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 100, description: 'Precio máximo (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Campo de ordenamiento (createdAt, title, price, releaseDate)',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
