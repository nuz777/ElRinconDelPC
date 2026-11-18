import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class ShortenUrlDto {
  @ApiProperty({
    example: 'https://gofile.io/d/abc123',
    description: 'URL original de descarga que se desea acortar con exe.io',
  })
  @IsString()
  @IsNotEmpty({ message: 'La URL es obligatoria' })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'La URL debe ser una dirección http o https válida' },
  )
  url!: string;

  @ApiPropertyOptional({
    example: 'elden-ring-pc',
    description: 'Alias o slug personalizado opcional para el enlace corto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  alias?: string;
}
