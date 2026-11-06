import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Role } from '../../../Auth/Domain/Entities/roles.enum.js';
import { Roles } from '../../../Auth/Infraestructure/security/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../Auth/Infraestructure/security/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../Auth/Infraestructure/security/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../Auth/Infraestructure/security/jwt.strategy.js';
import { ToolsService } from '../../Application/Services/tools.service.js';
import type { Tool } from '../../Domain/Entities/tool.entity.js';
import type { PaginatedResult } from '../../Domain/interfaces/tool.repository.interface.js';
import { CreateToolDto } from '../../Application/DTOs/create-tool.dto.js';
import { UpdateToolDto } from '../../Application/DTOs/update-tool.dto.js';
import { FilterToolsDto } from '../../Application/DTOs/filter-tools.dto.js';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  // ───────────────────────────── Rutas públicas ─────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar herramientas con filtros y paginación' })
  @ApiOkResponse({ description: 'Lista paginada de herramientas' })
  findAll(@Query() filters: FilterToolsDto): Promise<PaginatedResult<Tool>> {
    return this.toolsService.getTools(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una herramienta por ID' })
  @ApiOkResponse({ description: 'Detalle de la herramienta' })
  async findOne(@Param('id') id: string): Promise<Tool> {
    return this.toolsService.getToolById(id);
  }

  @Post(':id/download')
  @ApiOperation({
    summary: 'Incrementar el contador de descargas de una herramienta',
  })
  @ApiOkResponse({ description: 'Contador de descargas incrementado' })
  async incrementDownload(@Param('id') id: string): Promise<void> {
    return this.toolsService.incrementDownloadCount(id);
  }

  // ──────────────────── Rutas protegidas (solo administradores) ──────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publicar una nueva herramienta (Solo Administradores)',
  })
  @ApiCreatedResponse({ description: 'Herramienta creada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  async createTool(
    @Body() dto: CreateToolDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<Tool> {
    return this.toolsService.createTool(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reemplazar datos de una herramienta (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Herramienta actualizada' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  async replace(
    @Param('id') id: string,
    @Body() dto: UpdateToolDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<Tool> {
    return this.toolsService.updateTool(id, req.user.id, req.user.role, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar parcialmente una herramienta (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Herramienta actualizada parcialmente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateToolDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<Tool> {
    return this.toolsService.updateTool(id, req.user.id, req.user.role, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una herramienta (Solo Administradores)' })
  @ApiOkResponse({ description: 'Herramienta desactivada (borrado lógico)' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<{ message: string; id: string }> {
    return this.toolsService.deleteTool(id, req.user.id, req.user.role);
  }
}
