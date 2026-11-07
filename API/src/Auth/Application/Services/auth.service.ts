import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Role } from '../../Domain/Entities/roles.enum.js';
import type { User } from '../../Domain/Entities/user.entity.js';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../../Domain/interfaces/auth-repository.interface.js';
import {
  HASHING_SERVICE,
  JWT_SERVICE,
  MAIL_SERVICE,
  type HashingService,
  type JwtPayload,
  type MailService,
  type JwtService,
} from '../../Domain/services/index.js';
import type { LoginRequestDto } from '../DTOs/login-request.dto.js';
import type { RegisterRequestDto } from '../DTOs/register-request.dto.js';

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name?: string;
    email: string;
    provider: string;
    role?: Role;
    picture?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository,
    @Inject(HASHING_SERVICE) private readonly hashingService: HashingService,
    @Inject(JWT_SERVICE) private readonly jwtService: JwtService,
    @Optional() @Inject(MAIL_SERVICE) private readonly mailService?: MailService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthResult> {
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

  async login(dto: LoginRequestDto): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(
      dto.email.trim().toLowerCase(),
    );

    const invalid = new UnauthorizedException('Credenciales inválidas');
    if (!user || !user.passwordHash) throw invalid;

    const matches = await this.hashingService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!matches) throw invalid;

    return this.buildResponse(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Si el correo está registrado, recibirás un código de verificación.',
    };

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.authRepository.findByEmail(normalizedEmail);

    if (!user) {
      return genericResponse;
    }

    const code = randomInt(100000, 1000000).toString();
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.authRepository.update(user.id, {
      resetToken: code,
      resetTokenExpires,
    });

    if (this.mailService) {
      await this.mailService.sendResetCode(user.email, code);
    }

    return genericResponse;
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.authRepository.findByEmail(normalizedEmail);

    if (!user || !user.resetToken || user.resetToken !== code) {
      throw new BadRequestException(
        'El código ingresado es incorrecto o no existe.',
      );
    }

    if (
      !user.resetTokenExpires ||
      new Date() > new Date(user.resetTokenExpires)
    ) {
      throw new BadRequestException('El código de verificación ha expirado.');
    }

    const passwordHash = await this.hashingService.hash(newPassword);

    await this.authRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async getUserSession(
    userId: string,
    fallback?: { email: string; role?: Role | `${Role}`; name?: string },
  ): Promise<AuthResult['user']> {
    const user = await this.authRepository.findById(userId);
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        role: (user.role ?? Role.USER) as Role,
        picture: user.picture,
      };
    }

    if (!fallback) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return {
      id: userId,
      name: fallback.name,
      email: fallback.email,
      provider: 'local',
      role: (fallback.role ?? Role.USER) as Role,
    };
  }

  private async buildResponse(user: User): Promise<AuthResult> {
    const role = (user.role ?? Role.USER) as Role;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
      name: user.name,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        role,
        picture: user.picture,
      },
    };
  }
}
