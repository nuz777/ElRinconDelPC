import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { User } from '../../Domain/Entities/user.entity.js';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../../Domain/interfaces/auth-repository.interface.js';
import { getJwtSecret } from './jwt.constants.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role | `${Role}`;
  name?: string;
}

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: Role | `${Role}`;
  name?: string;
}

function getCookieName(): string {
  return process.env.JWT_COOKIE_NAME ?? 'access_token';
}

function extractJwtFromCookie(req: Request): string | null {
  const cookieName = getCookieName();
  if (req?.cookies?.[cookieName]) {
    return req.cookies[cookieName];
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback opcional para Swagger
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Consultar el estado actual del usuario en BD para detectar
    // revocación de rol o eliminación de cuenta antes de que expire el JWT.
    const user = await this.authRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        'Usuario no encontrado o cuenta inactiva. Inicie sesión nuevamente.',
      );
    }

    // Si el rol cambió desde que se emitió el token, denegar acceso.
    if (user.role !== payload.role) {
      throw new UnauthorizedException(
        'Sus permisos han cambiado. Inicie sesión nuevamente.',
      );
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: user.email ?? payload.email,
      role: user.role,
      name: (user as User & { name?: string }).name ?? payload.name,
    };
  }
}
