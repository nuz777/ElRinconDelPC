import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { GamesService } from '../Application/Services/games.service.js';
import { ModsService } from '../../Mods/Application/Services/mods.service.js';
import type { Game } from '../Domain/Entities/game.entity.js';
import type { PaginatedResult } from '../Domain/interfaces/game.repository.interface.js';
import type { PaginatedResult as ModsPaginatedResult } from '../../Mods/Domain/interfaces/mod.repository.interface.js';
import type { Mod } from '../../Mods/Domain/Entities/mod.entity.js';
import { CreateGameDto } from '../Application/DTOs/create-game.dto.js';
import { FilterGamesDto } from '../Application/DTOs/filter-games.dto.js';
import { UpdateGameDto } from '../Application/DTOs/update-game.dto.js';
// Import de valor (no `import type`): ValidationPipe necesita la clase en runtime para validar el query
import { FilterModsDto } from '../../Mods/Application/DTOs/filter-mods.dto.js';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly modsService: ModsService,
  ) {}

  // ───────────────────────────── Lectura pública ─────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Listar juegos con filtros y paginación',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de juegos',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Filtros de consulta inválidos',
  })
  findAll(@Query() filters: FilterGamesDto): Promise<PaginatedResult<Game>> {
    return this.gamesService.getGames(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un juego por ID o slug' })
  @ApiParam({
    name: 'id',
    description: 'UUID del juego o slug amigable (ej. hollow-knight)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detalle del juego' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Juego no encontrado' })
  async findOne(@Param('id') id: string): Promise<Game> {
    // Intentar por UUID primero; si no, tratar el parámetro como slug
    let game = await this.gamesService.getGameById(id).catch(() => null);
    if (!game) {
      game = await this.gamesService.getGameBySlug(id).catch(() => null);
    }
    if (!game) {
      throw new NotFoundException(`Juego "${id}" no encontrado`);
    }
    return game;
  }

  // ─────────────────────── Escritura (solo administradores) ───────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear un nuevo juego (Solo Administradores)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Juego creado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un juego con ese título o slug',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT ausente o inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permisos insuficientes',
  })
  create(@Body() dto: CreateGameDto): Promise<Game> {
    return this.gamesService.createGame(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reemplazar datos de un juego (Solo Administradores)',
  })
  @ApiParam({ name: 'id', description: 'UUID del juego' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Juego actualizado' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Juego no encontrado' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT ausente o inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permisos insuficientes',
  })
  replace(
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
  ): Promise<Game> {
    return this.gamesService.updateGame(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar parcialmente un juego (Solo Administradores)',
  })
  @ApiParam({ name: 'id', description: 'UUID del juego' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Juego actualizado parcialmente' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Juego no encontrado' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT ausente o inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permisos insuficientes',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
  ): Promise<Game> {
    return this.gamesService.updateGame(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar un juego (borrado lógico, Solo Administradores)',
  })
  @ApiParam({ name: 'id', description: 'UUID del juego' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Juego desactivado correctamente',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Juego no encontrado' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token JWT ausente o inválido',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permisos insuficientes',
  })
  remove(@Param('id') id: string): Promise<{ message: string; id: string }> {
    return this.gamesService.deleteGame(id);
  }

  // ─────────────────── Mods de un juego específico (público) ──────────────────

  @Get(':gameId/mods')
  @ApiOperation({
    summary: 'Listar mods asociados a un juego (activos y aprobados)',
  })
  @ApiParam({
    name: 'gameId',
    description: 'UUID del juego',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de mods del juego',
  })
  async getGamesMods(
    @Param('gameId') gameId: string,
    @Query() filters: FilterModsDto,
  ): Promise<ModsPaginatedResult<Mod>> {
    return this.modsService.getModsByGame(gameId, filters);
  }
}
