import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '../../Guards/index.js';
import { ShortenUrlDto } from './dto/shorten-url.dto.js';
import { ExeIoService } from './exe-io.service.js';

@ApiTags('Shortener')
@Controller('shortener')
export class ShortenerController {
  constructor(private readonly exeIoService: ExeIoService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Acortar un enlace de descarga mediante exe.io (Solo Administradores)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'URL acortada (o URL original como respaldo si exe.io falla)',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'URL inválida',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT ausente o inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permisos insuficientes',
  })
  async shorten(
    @Body() dto: ShortenUrlDto,
  ): Promise<{ shortenedUrl: string }> {
    const shortenedUrl = await this.exeIoService.shortenUrl(dto.url, dto.alias);
    return { shortenedUrl };
  }
}
