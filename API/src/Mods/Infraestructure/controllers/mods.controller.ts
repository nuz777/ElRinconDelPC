import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { ModsService } from '../../Application/Services/mods.service.js';
import type { Mod } from '../../Domain/Entities/mod.entity.js';
import type { PaginatedResult } from '../../Domain/interfaces/mod.repository.interface.js';
import type { CreateModDto } from '../../Application/DTOs/create-mod.dto.js';
import type { UpdateModDto } from '../../Application/DTOs/update-mod.dto.js';
import type { FilterModsDto } from '../../Application/DTOs/filter-mods.dto.js';

@ApiTags('Mods')
@Controller('mods')
export class ModsController {
  constructor(private readonly modsService: ModsService) {}

  // ───────────────────────────── Rutas públicas ─────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle completo de un mod' })
  @ApiOkResponse({ description: 'Detalle del mod con información del juego y autor' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  async getModById(@Param('id') id: string) {
    return this.modsService.getModById(id);
  }

  @Post(':id/download')
  @ApiOperation({
    summary: 'Incrementar el contador de descargas y obtener la URL de descarga',
  })
  @ApiOkResponse({ description: 'Contador incrementado y URL de descarga' })
  @ApiUnauthorizedResponse({ description: 'Mod no encontrado' })
  async downloadMod(@Param('id') id: string) {
    await this.modsService.incrementDownloadCount(id);
    const { mod } = await this.modsService.getModById(id);
    return { downloadUrl: mod.downloadUrl };
  }

  // ──────────────────── Rutas protegidas (sesión activa) ────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo mod (asignado al usuario autenticado)',
  })
  @ApiCreatedResponse({ description: 'Mod creado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  async createMod(
    @Body() dto: CreateModDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<Mod> {
    return this.modsService.createMod(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un mod (autor o administrador)' })
  @ApiOkResponse({ description: 'Mod actualizado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para editar este mod' })
  async updateMod(
    @Param('id') id: string,
    @Body() dto: UpdateModDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<Mod> {
    return this.modsService.updateMod(id, req.user.id, req.user.role, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un mod (borrado lógico)' })
  @ApiOkResponse({ description: 'Mod desactivado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para eliminar este mod' })
  async deleteMod(
    @Param('id') id: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<{ message: string; id: string }> {
    return this.modsService.deleteMod(id, req.user.id, req.user.role);
  }

  // ──────────────────────── Rutas de administrador ──────────────────────────

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Aprobar un mod pendiente de revisión (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Mod aprobado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  async approveMod(@Param('id') id: string): Promise<Mod> {
    return this.modsService.approveMod(id);
  }
}
