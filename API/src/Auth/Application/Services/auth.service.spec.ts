/* oxlint-disable typescript/unbound-method */
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { User } from '../../Domain/Entities/user.entity.js';
import type { AuthRepository } from '../../Domain/interfaces/auth-repository.interface.js';
import type { MailService } from '../../Infraestructure/mail/mail.service.js';
import type { HashingService } from '../../Infraestructure/security/hashing.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let mockRepository: AuthRepository;
  let mockHashingService: HashingService;
  let mockJwtService: JwtService;
  let mockMailService: MailService;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    mockHashingService = {
      hash: vi.fn().mockResolvedValue('hashed_secret'),
      compare: vi.fn(),
    } as unknown as HashingService;

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt_mock_token'),
    } as unknown as JwtService;

    mockMailService = {
      sendResetCode: vi.fn().mockResolvedValue(undefined),
    } as unknown as MailService;

    authService = new AuthService(
      mockRepository,
      mockHashingService,
      mockJwtService,
      mockMailService,
    );
  });

  describe('register', () => {
    it('debe registrar un usuario nuevo correctamente', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(
        new User('u-1', 'Nuz', 'nuz@sotano.com', 'hashed_secret'),
      );

      const result = await authService.register({
        name: 'Nuz',
        email: 'nuz@sotano.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('jwt_mock_token');
      expect(result.user.email).toBe('nuz@sotano.com');
      expect(result.user.name).toBe('Nuz');
      expect(mockHashingService.hash).toHaveBeenCalledWith('Password123!');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el correo ya existe', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User('u-1', 'Existente', 'nuz@sotano.com', 'hash'),
      );

      await expect(
        authService.register({
          name: 'Nuz',
          email: 'nuz@sotano.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('debe iniciar sesión correctamente con credenciales válidas', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User('u-1', 'Nuz', 'nuz@sotano.com', 'hashed_secret'),
      );
      vi.mocked(mockHashingService.compare).mockResolvedValue(true);

      const result = await authService.login({
        email: 'nuz@sotano.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('jwt_mock_token');
      expect(result.user.id).toBe('u-1');
      expect(mockHashingService.compare).toHaveBeenCalledWith(
        'Password123!',
        'hashed_secret',
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'noexiste@sotano.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña no coincide', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User('u-1', 'Nuz', 'nuz@sotano.com', 'hashed_secret'),
      );
      vi.mocked(mockHashingService.compare).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'nuz@sotano.com',
          password: 'PasswordIncorrecta',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('debe retornar mensaje genérico sin enviar correo si el usuario no existe', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const result = await authService.forgotPassword('noexiste@sotano.com');

      expect(result).toEqual({
        message:
          'Si el correo está registrado, recibirás un código de verificación.',
      });
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockMailService.sendResetCode).not.toHaveBeenCalled();
    });

    it('debe generar código de 6 dígitos, guardar expiración y enviar correo si el usuario existe', async () => {
      const existingUser = new User(
        'u-1',
        'Nuz',
        'nuz@sotano.com',
        'hashed_secret',
      );
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(existingUser);

      const result = await authService.forgotPassword('nuz@sotano.com');

      expect(result).toEqual({
        message:
          'Si el correo está registrado, recibirás un código de verificación.',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(
        'u-1',
        expect.objectContaining({
          resetToken: expect.stringMatching(/^\d{6}$/) as unknown as string,
          resetTokenExpires: expect.any(Date) as unknown as Date,
        }),
      );
      expect(mockMailService.sendResetCode).toHaveBeenCalledWith(
        'nuz@sotano.com',
        expect.stringMatching(/^\d{6}$/),
      );
    });
  });

  describe('resetPassword', () => {
    it('debe lanzar BadRequestException si el código es incorrecto o el usuario no existe', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User({
          id: 'u-1',
          email: 'nuz@sotano.com',
          resetToken: '123456',
          resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );

      await expect(
        authService.resetPassword('nuz@sotano.com', '999999', 'NuevaClave123!'),
      ).rejects.toThrowError(
        new BadRequestException(
          'El código ingresado es incorrecto o no existe.',
        ),
      );
    });

    it('debe lanzar BadRequestException si el código ha expirado', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User({
          id: 'u-1',
          email: 'nuz@sotano.com',
          resetToken: '123456',
          resetTokenExpires: new Date(Date.now() - 60 * 1000),
        }),
      );

      await expect(
        authService.resetPassword('nuz@sotano.com', '123456', 'NuevaClave123!'),
      ).rejects.toThrowError(
        new BadRequestException('El código de verificación ha expirado.'),
      );
    });

    it('debe actualizar la contraseña y limpiar resetToken y resetTokenExpires', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User({
          id: 'u-1',
          email: 'nuz@sotano.com',
          resetToken: '123456',
          resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
        }),
      );

      const result = await authService.resetPassword(
        'nuz@sotano.com',
        '123456',
        'NuevaClave123!',
      );

      expect(result).toEqual({
        message: 'Contraseña actualizada exitosamente.',
      });
      expect(mockHashingService.hash).toHaveBeenCalledWith('NuevaClave123!');
      expect(mockRepository.update).toHaveBeenCalledWith('u-1', {
        passwordHash: 'hashed_secret',
        resetToken: null,
        resetTokenExpires: null,
      });
    });
  });
});
