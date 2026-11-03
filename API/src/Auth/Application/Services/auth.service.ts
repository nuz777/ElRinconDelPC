import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../../Domain/Entities/user.entity.js';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../../Domain/interfaces/auth-repository.interface.js';
import { HashingService } from '../../Infraestructure/security/hashing.service.js';
import type { JwtPayload } from '../../Infraestructure/security/jwt.strategy.js';
import type { OAuthUser } from '../../Infraestructure/security/google.strategy.js';
import type { AuthResponseDto } from '../../Presentation/dtos/auth-response.dto.js';
import type { LoginRequestDto } from '../../Presentation/dtos/login-request.dto.js';
import type { RegisterRequestDto } from '../../Presentation/dtos/register-request.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.authRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await this.hashingService.hash(dto.password);
    const user = await this.authRepository.create({
      name: dto.name.trim(),
      email,
      passwordHash,
      provider: 'local',
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.authRepository.findByEmail(
      dto.email.trim().toLowerCase(),
    );

    const invalid = new UnauthorizedException('Credenciales inválidas');
    if (!user) throw invalid;

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        `Esta cuenta fue creada con ${user.provider}. Por favor, inicia sesión mediante ${user.provider}.`,
      );
    }

    const matches = await this.hashingService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!matches) throw invalid;

    return this.buildResponse(user);
  }

  async validateOAuthLogin(oauthUser: OAuthUser): Promise<AuthResponseDto> {
    const email = oauthUser.email.trim().toLowerCase();

    // 1. Buscar por proveedor y providerId
    let user = await this.authRepository.findByProviderId(
      oauthUser.provider,
      oauthUser.providerId,
    );

    if (user) {
      const updated = await this.authRepository.update(user.id, {
        name: user.name || oauthUser.name,
        picture: oauthUser.picture || user.picture,
      });
      return this.buildResponse(updated ?? user);
    }

    // 2. Si no existe por providerId, buscar por email
    if (email) {
      user = await this.authRepository.findByEmail(email);
      if (user) {
        const updated = await this.authRepository.update(user.id, {
          provider: oauthUser.provider,
          providerId: oauthUser.providerId,
          name: user.name || oauthUser.name,
          picture: oauthUser.picture || user.picture,
        });
        return this.buildResponse(updated ?? user);
      }
    }

    // 3. Crear nuevo usuario si no existía
    const newUser = await this.authRepository.create({
      email,
      provider: oauthUser.provider,
      providerId: oauthUser.providerId,
      name: oauthUser.name,
      picture: oauthUser.picture,
    });

    return this.buildResponse(newUser);
  }

  private async buildResponse(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        picture: user.picture,
      },
    };
  }
}
