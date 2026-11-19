import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../Auth/Infraestructure/security/jwt.strategy.js';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '../../Guards/index.js';
import {
  AiAutocompleteResponseDto,
  AiConfigStatusResponseDto,
  DeleteAiConfigResponseDto,
  SaveAiConfigResponseDto,
} from '../Application/DTOs/ai-copilot-response.dto.js';
import { AutocompleteGameDto } from '../Application/DTOs/autocomplete-game.dto.js';
import { UpdateAiConfigDto } from '../Application/DTOs/update-ai-config.dto.js';
import { AiCopilotService } from '../Application/Services/ai-copilot.service.js';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('AI Copilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('ai-copilot')
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Verificar configuración de API Key IA del administrador logueado',
  })
  @ApiOkResponse({ type: AiConfigStatusResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  getConfig(
    @Req() req: AuthenticatedRequest,
  ): Promise<AiConfigStatusResponseDto> {
    const userId = req.user.id || req.user.userId;
    return this.aiCopilotService.getConfig(userId);
  }

  @Put('config')
  @ApiOperation({
    summary: 'Guardar o actualizar la API Key cifrada (AES-256-GCM) del administrador',
  })
  @ApiOkResponse({ type: SaveAiConfigResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  saveConfig(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAiConfigDto,
  ): Promise<SaveAiConfigResponseDto> {
    const userId = req.user.id || req.user.userId;
    return this.aiCopilotService.saveConfig(userId, dto);
  }

  @Delete('config')
  @ApiOperation({
    summary: 'Eliminar la API Key IA guardada del administrador',
  })
  @ApiOkResponse({ type: DeleteAiConfigResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  deleteConfig(
    @Req() req: AuthenticatedRequest,
  ): Promise<DeleteAiConfigResponseDto> {
    const userId = req.user.id || req.user.userId;
    return this.aiCopilotService.deleteConfig(userId);
  }

  @Post('autocomplete')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({
    summary: 'Autocompletar ficha técnica de un título usando la API Key del administrador',
  })
  @ApiOkResponse({ type: AiAutocompleteResponseDto })
  @ApiBadRequestResponse({
    description: 'Título inválido o administrador sin API Key configurada',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o API Key del proveedor IA rechazada',
  })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  @ApiTooManyRequestsResponse({
    description: 'Cuota del proveedor IA agotada o demasiadas peticiones',
  })
  autocomplete(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AutocompleteGameDto,
  ): Promise<AiAutocompleteResponseDto> {
    const userId = req.user.id || req.user.userId;
    return this.aiCopilotService.autocomplete(userId, dto);
  }
}
