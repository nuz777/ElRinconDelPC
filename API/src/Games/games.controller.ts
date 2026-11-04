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
import { CreateGameDto, UpdateGameDto } from './dtos/create-game.dto.js';
import { type GameItem, GamesService } from './games.service.js';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los juegos publicados' })
  @ApiOkResponse({ description: 'Lista de juegos' })
  findAll(): GameItem[] {
    return this.gamesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un juego por ID' })
  @ApiOkResponse({ description: 'Detalle del juego' })
  findOne(@Param('id') id: string): GameItem {
    return this.gamesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un nuevo juego (Solo Administradores)' })
  @ApiCreatedResponse({ description: 'Juego creado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  create(
    @Body() dto: CreateGameDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ): GameItem {
    return this.gamesService.create(dto, req.user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reemplazar datos de un juego (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Juego actualizado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  replace(@Param('id') id: string, @Body() dto: UpdateGameDto): GameItem {
    return this.gamesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar parcialmente un juego (Solo Administradores)',
  })
  @ApiOkResponse({ description: 'Juego actualizado parcialmente' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto): GameItem {
    return this.gamesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un juego (Solo Administradores)' })
  @ApiOkResponse({ description: 'Juego eliminado' })
  @ApiUnauthorizedResponse({ description: 'Token JWT ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Permisos insuficientes' })
  remove(@Param('id') id: string): { deleted: boolean; id: string } {
    return this.gamesService.remove(id);
  }
}
