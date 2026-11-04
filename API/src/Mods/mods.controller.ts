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
import { CreateModDto, UpdateModDto } from './dtos/create-mod.dto.js';
import { type ModItem, ModsService } from './mods.service.js';

@ApiTags('Mods')
@Controller('mods')
export class ModsController {
  constructor(private readonly modsService: ModsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los mods publicados' })
  @ApiOkResponse({ description: 'Lista de mods' })
  findAll(): ModItem[] {
    return this.modsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un mod por ID' })
  @ApiOkResponse({ description: 'Detalle del mod' })
  findOne(@Param('id') id: string): ModItem {
    return this.modsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un nuevo mod (Solo Administradores)' })
  @ApiCreatedResponse({ description: 'Mod creado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  create(
    @Body() dto: CreateModDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): ModItem {
    return this.modsService.create(dto, req.user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reemplazar datos de un mod (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Mod actualizado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  replace(@Param('id') id: string, @Body() dto: UpdateModDto): ModItem {
    return this.modsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar parcialmente un mod (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Mod actualizado parcialmente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  update(@Param('id') id: string, @Body() dto: UpdateModDto): ModItem {
    return this.modsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un mod (Solo Administradores)' })
  @ApiOkResponse({ description: 'Mod eliminado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  remove(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.modsService.remove(id);
  }
}
