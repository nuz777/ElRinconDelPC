import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { Role } from '../Auth/Domain/Entities/roles.enum.js';
import { Roles } from '../Auth/Infraestructure/security/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../Auth/Infraestructure/security/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/Infraestructure/security/guards/roles.guard.js';
import type { AuthenticatedUser } from '../Auth/Infraestructure/security/jwt.strategy.js';
import { CreateToolDto, UpdateToolDto } from './dtos/create-tool.dto.js';
import { type ToolItem, ToolsService } from './tools.service.js';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las herramientas publicadas' })
  @ApiOkResponse({ description: 'Lista de herramientas' })
  findAll(): ToolItem[] {
    return this.toolsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una herramienta por ID' })
  @ApiOkResponse({ description: 'Detalle de la herramienta' })
  findOne(@Param('id') id: string): ToolItem {
    return this.toolsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publicar una nueva herramienta (Solo Administradores)',
  })
  @ApiCreatedResponse({ description: 'Herramienta creada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  create(
    @Body() dto: CreateToolDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): ToolItem {
    return this.toolsService.create(dto, req.user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reemplazar datos de una herramienta (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Herramienta actualizada' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  replace(@Param('id') id: string, @Body() dto: UpdateToolDto): ToolItem {
    return this.toolsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar parcialmente una herramienta (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Herramienta actualizada parcialmente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  update(@Param('id') id: string, @Body() dto: UpdateToolDto): ToolItem {
    return this.toolsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una herramienta (Solo Administradores)' })
  @ApiOkResponse({ description: 'Herramienta eliminada' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  remove(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.toolsService.remove(id);
  }
}
