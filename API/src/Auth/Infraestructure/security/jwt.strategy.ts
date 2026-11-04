import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { getJwtSecret } from './jwt.constants.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role | `${Role}`;
}

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: Role | `${Role}`;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
    };
  }
}
