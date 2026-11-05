import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
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
import type { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService, type AuthResult } from '../Application/Services/auth.service.js';
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

function getCookieOptions(): Record<string, unknown> {
  // Cookie HTTP-only persistente (7 días por defecto) para mantener sesión al cerrar y reabrir el navegador.
  return {
    httpOnly: true,
    secure: process.env.JWT_COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE ?? '604800000', 10),
  };
}

function getCookieName(): string {
  return process.env.JWT_COOKIE_NAME ?? 'access_token';
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(getCookieName(), token, getCookieOptions());
  }

  private clearAuthCookie(res: Response): void {
    res.clearCookie(getCookieName(), {
      httpOnly: true,
      secure: process.env.JWT_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Usuario creado', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  async register(
    @Body() dto: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result: AuthResult = await this.authService.register(dto);
    this.setAuthCookie(res, result.accessToken);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Iniciar sesión con credenciales locales' })
  @ApiOkResponse({ description: 'Sesión iniciada', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result: AuthResult = await this.authService.login(dto);
    this.setAuthCookie(res, result.accessToken);
    return { user: result.user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
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
  @UseGuards(ThrottlerGuard)
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión y eliminar cookie de autenticación' })
  @ApiOkResponse({ description: 'Sesión cerrada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'No autenticado' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookie(res);
    return { statusCode: 200, message: 'Sesión cerrada correctamente' };
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar si existe una sesión válida' })
  @ApiOkResponse({ description: 'Sesión activa', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'No autenticado o token expirado' })
  async check(@Req() req: Request & { user: AuthenticatedUser }) {
    const user = await this.authService.getUserSession(req.user.id, req.user);
    return {
      authenticated: true,
      user,
    };
  }
}
