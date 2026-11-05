import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Role } from '../../Domain/Entities/roles.enum.js';
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
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback opcional para Swagger
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role ?? Role.USER,
      name: payload.name,
    };
  }
}
