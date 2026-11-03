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
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../Application/Services/auth.service.js';
import type { OAuthUser } from '../Infraestructure/security/google.strategy.js';
import { AuthResponseDto } from './dtos/auth-response.dto.js';
import { LoginRequestDto } from './dtos/login-request.dto.js';
import { RegisterRequestDto } from './dtos/register-request.dto.js';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticación con Google OAuth2' })
  @ApiResponse({ status: 302, description: 'Redirección a Google Accounts' })
  googleAuth(): void {
    // Passport redirige automáticamente al flujo de Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de autenticación con Google OAuth2' })
  @ApiOkResponse({
    description: 'Autenticación con Google exitosa',
    type: AuthResponseDto,
  })
  async googleCallback(
    @Req() req: Request & { user: OAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const authResult = await this.authService.validateOAuthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.headers.accept?.includes('application/json')) {
      const target = `${frontendUrl}/?token=${encodeURIComponent(
        authResult.accessToken,
      )}&user=${encodeURIComponent(JSON.stringify(authResult.user))}`;
      return res.redirect(target);
    }

    res.json(authResult);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Iniciar autenticación con GitHub OAuth2' })
  @ApiResponse({ status: 302, description: 'Redirección a GitHub' })
  githubAuth(): void {
    // Passport redirige automáticamente al flujo de GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Callback de autenticación con GitHub OAuth2' })
  @ApiOkResponse({
    description: 'Autenticación con GitHub exitosa',
    type: AuthResponseDto,
  })
  async githubCallback(
    @Req() req: Request & { user: OAuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const authResult = await this.authService.validateOAuthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!req.headers.accept?.includes('application/json')) {
      const target = `${frontendUrl}/?token=${encodeURIComponent(
        authResult.accessToken,
      )}&user=${encodeURIComponent(JSON.stringify(authResult.user))}`;
      return res.redirect(target);
    }

    res.json(authResult);
  }
}
