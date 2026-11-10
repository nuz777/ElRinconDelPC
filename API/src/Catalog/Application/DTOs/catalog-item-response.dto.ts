import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogSection } from '../../Domain/Entities/catalog-section.enum.js';

export class CatalogItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: CatalogSection })
  section!: CatalogSection;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  genre!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  size!: string | null;

  @ApiProperty({ example: 'v1.0' })
  version!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  badge!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  coverUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  bannerUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  downloadUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  developer!: string | null;

  @ApiProperty()
  shortDescription!: string;

  @ApiPropertyOptional({ nullable: true })
  minimumRequirements!: {
    os: string;
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
  } | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    example: 'a3f9k2',
    description: 'Código público fijo usado en la URL compartible',
  })
  publicCode!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, example: 'Nintendo' })
  brand!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, example: 'Nintendo 64' })
  console!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, example: 'Project64 / simple64' })
  emulator!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedCatalogResponseDto {
  @ApiProperty({ type: [CatalogItemResponseDto] })
  items!: CatalogItemResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}
