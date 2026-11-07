import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../Application/Services/auth.service.js';
import {
  AUTH_REPOSITORY,
} from '../Domain/interfaces/auth-repository.interface.js';
import {
  HASHING_SERVICE,
  JWT_SERVICE,
  MAIL_SERVICE,
} from '../Domain/services/index.js';
import { AuthController } from '../Presentation/auth.controller.js';
import {
  InMemoryAuthRepository,
  PostgresAuthRepository,
} from './repositories/auth.repository.js';
import { JwtAuthGuard } from '../../Guards/jwt-auth.guard.js';
import { RolesGuard } from '../../Guards/roles.guard.js';
import { HashingService } from './security/hashing.service.js';
import { HashingServiceAdapter } from './security/hashingservice.adapter.js';
import { getJwtExpiresIn, getJwtSecret } from './security/jwt.constants.js';
import { JwtServiceAdapter } from './security/jwtservice.adapter.js';
import { JwtStrategy } from './security/jwt.strategy.js';
import { MailService } from './mail/mail.service.js';
import { MailServiceAdapter } from './mail/mailservice.adapter.js';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: {
          expiresIn: getJwtExpiresIn() as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Domain ports -> Infraestructure adapters (using Symbol injection tokens)
    {
      provide: HASHING_SERVICE,
      useClass: HashingServiceAdapter,
    },
    {
      provide: MAIL_SERVICE,
      useClass: MailServiceAdapter,
    },
    {
      provide: JWT_SERVICE,
      useClass: JwtServiceAdapter,
    },
    // Concrete infraestructure services (needed by adapters)
    HashingService,
    MailService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    InMemoryAuthRepository,
    PostgresAuthRepository,
    { provide: AUTH_REPOSITORY, useClass: PostgresAuthRepository },
  ],
  exports: [
    AuthService,
    HASHING_SERVICE,
    MAIL_SERVICE,
    JWT_SERVICE,
    JwtAuthGuard,
    RolesGuard,
    AUTH_REPOSITORY,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
