import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../Application/Services/auth.service.js';
import {
  AUTH_REPOSITORY,
  AUTH_REPOSITORY_TOKEN,
} from '../Domain/interfaces/auth-repository.interface.js';
import { AuthController } from '../Presentation/auth.controller.js';
import { InMemoryAuthRepository } from './repositories/in-memory-auth.repository.js';
import { GitHubStrategy } from './security/github.strategy.js';
import { GoogleStrategy } from './security/google.strategy.js';
import { HashingService } from './security/hashing.service.js';
import { getJwtExpiresIn, getJwtSecret } from './security/jwt.constants.js';
import { JwtStrategy } from './security/jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        // En jsonwebtoken / NestJS jwt, expiresIn acepta cadenas como '7d', '1h' o número en segundos
        expiresIn: getJwtExpiresIn() as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashingService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    InMemoryAuthRepository,
    { provide: AUTH_REPOSITORY, useClass: InMemoryAuthRepository },
    { provide: AUTH_REPOSITORY_TOKEN, useClass: InMemoryAuthRepository },
  ],
  exports: [
    AuthService,
    AUTH_REPOSITORY,
    AUTH_REPOSITORY_TOKEN,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
