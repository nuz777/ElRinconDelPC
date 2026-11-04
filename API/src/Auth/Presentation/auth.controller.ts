import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../Application/Services/auth.service.js';
import { Role } from '../Domain/Entities/roles.enum.js';
import { Roles } from '../Infraestructure/security/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../Infraestructure/security/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Infraestructure/security/guards/roles.guard.js';
import type { AuthenticatedUser } from '../Infraestructure/security/jwt.strategy.js';
import { AuthResponseDto } from './dtos/auth-response.dto.js';
import { ForgotPasswordDto } from './dtos/forgot-password.dto.js';
import { LoginRequestDto } from './dtos/login-request.dto.js';
import { RegisterRequestDto } from './dtos/register-request.dto.js';
import { ResetPasswordDto } from './dtos/reset-password.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con credenciales locales' })
  @ApiOkResponse({ description: 'Sesión iniciada', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar código de 6 dígitos para recuperación de contraseña',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Si el correo está registrado, se envía el código de verificación de 6 dígitos (expira en 15 minutos)',
  })
  @ApiBadRequestResponse({ description: 'Correo electrónico inválido' })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Restablecer la contraseña mediante el código de verificación de 6 dígitos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contraseña actualizada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Código incorrecto, expirado o datos inválidos',
  })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }

  @Get('admin/only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint de prueba exclusivo para administradores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Acceso concedido al administrador',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado o token JWT inválido',
  })
  @ApiForbiddenResponse({
    description: 'No tienes permisos para acceder a este recurso',
  })
  adminOnly(@Req() req: Request & { user: AuthenticatedUser }) {
    return {
      message: 'Acceso concedido: Bienvenido al panel de administración',
      user: req.user,
    };
  }
}
