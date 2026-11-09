import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '../../Guards/index.js';
import { CatalogService } from '../Application/Services/catalog.service.js';
import type { CatalogItem } from '../Domain/Entities/catalog-item.entity.js';
import type { PaginatedResult } from '../Domain/interfaces/catalog.repository.interface.js';
import {
  CatalogItemResponseDto,
  PaginatedCatalogResponseDto,
} from '../Application/DTOs/catalog-item-response.dto.js';
import { CreateCatalogItemDto } from '../Application/DTOs/create-catalog-item.dto.js';
import { FilterCatalogDto } from '../Application/DTOs/filter-catalog.dto.js';
import { UpdateCatalogItemDto } from '../Application/DTOs/update-catalog-item.dto.js';

const ID_PARAM = { name: 'id', format: 'uuid', description: 'UUID del ítem' };

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ───────────────────────────── Lectura pública ─────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar el catálogo con filtros y paginación' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedCatalogResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Filtros inválidos' })
  findAll(
    @Query() filters: FilterCatalogDto,
  ): Promise<PaginatedResult<CatalogItem>> {
    return this.catalogService.getCatalog(filters);
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
