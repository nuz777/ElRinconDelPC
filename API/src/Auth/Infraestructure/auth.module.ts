import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../Application/Services/auth.service.js';
import {
  AUTH_REPOSITORY,
  AUTH_REPOSITORY_TOKEN,
} from '../Domain/interfaces/auth-repository.interface.js';
import { AuthController } from '../Presentation/auth.controller.js';
import { MailService } from './mail/mail.service.js';
import {
  InMemoryAuthRepository,
  PostgresAuthRepository,
} from './repositories/auth.repository.js';
import { JwtAuthGuard } from './security/guards/jwt-auth.guard.js';
import { RolesGuard } from './security/guards/roles.guard.js';
import { HashingService } from './security/hashing.service.js';
import { getJwtExpiresIn, getJwtSecret } from './security/jwt.constants.js';
import { JwtStrategy } from './security/jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // registerAsync: el secreto se lee en tiempo de arranque (cuando .env ya fue cargado),
    // no en tiempo de import, para que firma y verificación usen el mismo JWT_SECRET.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: {
          // En jsonwebtoken / NestJS jwt, expiresIn acepta cadenas como '1d', '7d', '1h' o número en segundos
          expiresIn: getJwtExpiresIn() as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashingService,
    MailService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    InMemoryAuthRepository,
    PostgresAuthRepository,
    { provide: AUTH_REPOSITORY, useClass: PostgresAuthRepository },
    { provide: AUTH_REPOSITORY_TOKEN, useClass: PostgresAuthRepository },
  ],
  exports: [
    AuthService,
    HashingService,
    MailService,
    JwtAuthGuard,
    RolesGuard,
    AUTH_REPOSITORY,
    AUTH_REPOSITORY_TOKEN,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
