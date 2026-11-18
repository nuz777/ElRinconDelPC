import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '../../Guards/index.js';
import {
  CatalogItemResponseDto,
  PaginatedCatalogResponseDto,
} from '../Application/DTOs/catalog-item-response.dto.js';
import { CreateCatalogItemDto } from '../Application/DTOs/create-catalog-item.dto.js';
import { FilterCatalogDto } from '../Application/DTOs/filter-catalog.dto.js';
import { UpdateCatalogItemDto } from '../Application/DTOs/update-catalog-item.dto.js';
import { CatalogService } from '../Application/Services/catalog.service.js';
import type { CatalogItem } from '../Domain/Entities/catalog-item.entity.js';
import type {
  CatalogMediaKind,
  PaginatedResult,
} from '../Domain/interfaces/catalog.repository.interface.js';
import { CATALOG_MEDIA_PLACEHOLDER } from '../Infraestructure/repositories/typeorm-catalog.repository.js';

const ID_PARAM = { name: 'id', format: 'uuid', description: 'UUID del ítem' };
const DATA_IMAGE_REGEX = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;

function resolveApiOrigin(req?: Request): string {
  const host = req?.get?.('host');
  if (!host) return '';
  return `${req?.protocol || 'http'}://${host}`;
}

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ───────────────────────────── Lectura pública ─────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar el catálogo con filtros y paginación' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedCatalogResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Filtros inválidos' })
  async findAll(
    @Query() filters: FilterCatalogDto,
    @Req() req?: Request,
  ): Promise<PaginatedResult<CatalogItem>> {
    const { view, ...rest } = filters;
    const result = await this.catalogService.getCatalog({
      ...rest,
      summary: view === 'summary',
    });

    const origin = resolveApiOrigin(req);
    for (const item of result.items) {
      const version = item.updatedAt?.getTime?.() ?? Date.now();
      if (item.coverUrl === CATALOG_MEDIA_PLACEHOLDER) {
        item.coverUrl = `${origin}/catalog/${item.id}/media/cover?v=${version}`;
      }
      if (item.bannerUrl === CATALOG_MEDIA_PLACEHOLDER) {
        item.bannerUrl = `${origin}/catalog/${item.id}/media/banner?v=${version}`;
      }
    }

    return result;
  }

  @Get(':id/media/:kind')
  @ApiOperation({
    summary: 'Servir portada o banner del catálogo con caché HTTP',
  })
  @ApiParam(ID_PARAM)
  @ApiParam({ name: 'kind', enum: ['cover', 'banner'] })
  async getMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('kind') kind: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (kind !== 'cover' && kind !== 'banner') {
      throw new BadRequestException('El tipo de media debe ser cover o banner');
    }

    const media = await this.catalogService.getItemMedia(
      id,
      kind as CatalogMediaKind,
    );
    const value = media.value;
    if (!value) {
      throw new NotFoundException(`Recurso multimedia (${kind}) no encontrado`);
    }

    const match = DATA_IMAGE_REGEX.exec(value);
    if (match) {
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const etag = `"${id}-${kind}-${media.updatedAt.getTime()}"`;

      if (req.headers['if-none-match'] === etag) {
        res.status(HttpStatus.NOT_MODIFIED).end();
        return;
      }

      const cacheControl = req.query?.v
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400';

      res
        .status(HttpStatus.OK)
        .setHeader('Content-Type', mimeType)
        .setHeader('Content-Length', buffer.length)
        .setHeader('ETag', etag)
        .setHeader('Cache-Control', cacheControl)
        .send(buffer);
      return;
    }

    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/')
    ) {
      res.redirect(HttpStatus.FOUND, value);
      return;
    }

    throw new NotFoundException(`Formato de media no soportado para "${id}"`);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Obtener un ítem por su código público (URL compartible)',
  })
  @ApiParam({
    name: 'code',
    description: 'Código público de 6 caracteres (ej. a3f9k2)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: CatalogItemResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ítem no encontrado' })
  findByCode(@Param('code') code: string): Promise<CatalogItem> {
    return this.catalogService.getItemByPublicCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de un ítem del catálogo' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: HttpStatus.OK, type: CatalogItemResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ítem no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CatalogItem> {
    return this.catalogService.getItemById(id);
  }

  // ─────────────────────── Escritura (solo administradores) ───────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un juego, mod o herramienta (Solo Admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CatalogItemResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente o inválido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permisos insuficientes' })
  create(
    @Body() dto: CreateCatalogItemDto,
    @Req() req?: { user?: { id?: string; sub?: string } },
  ): Promise<CatalogItem> {
    return this.catalogService.createItem(dto, req?.user?.id ?? req?.user?.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un ítem del catálogo (Solo Admin)' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: HttpStatus.OK, type: CatalogItemResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente o inválido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permisos insuficientes' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ítem no encontrado' })
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogItemDto,
  ): Promise<CatalogItem> {
    return this.catalogService.updateItem(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar parcialmente un ítem (Solo Admin)' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: HttpStatus.OK, type: CatalogItemResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente o inválido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permisos insuficientes' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ítem no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCatalogItemDto,
  ): Promise<CatalogItem> {
    return this.catalogService.updateItem(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un ítem del catálogo (Solo Admin)' })
  @ApiParam(ID_PARAM)
  @ApiResponse({ status: HttpStatus.OK, description: 'Ítem eliminado correctamente' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente o inválido' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Permisos insuficientes' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ítem no encontrado' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; id: string }> {
    return this.catalogService.deleteItem(id);
  }
}
