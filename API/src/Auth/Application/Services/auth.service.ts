import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../Domain/Entities/roles.enum.js';
import type { User } from '../../Domain/Entities/user.entity.js';
import {
  AUTH_REPOSITORY,
  type AuthRepository,
} from '../../Domain/interfaces/auth-repository.interface.js';
import { MailService } from '../../Infraestructure/mail/mail.service.js';
import { HashingService } from '../../Infraestructure/security/hashing.service.js';
import type { JwtPayload } from '../../Infraestructure/security/jwt.strategy.js';
import type { AuthResponseDto } from '../../Presentation/dtos/auth-response.dto.js';
import type { LoginRequestDto } from '../../Presentation/dtos/login-request.dto.js';
import type { RegisterRequestDto } from '../../Presentation/dtos/register-request.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Optional() private readonly mailService?: MailService,
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
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

  private async buildResponse(user: User): Promise<AuthResponseDto> {
    const role = user.role ?? Role.USER;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
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
