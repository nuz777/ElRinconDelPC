/* oxlint-disable typescript/unbound-method */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User } from '../../Domain/Entities/user.entity.js';
import type { AuthRepository } from '../../Domain/interfaces/auth-repository.interface.js';
import type { HashingService } from '../../Infraestructure/security/hashing.service.js';
import type { JwtService } from '@nestjs/jwt';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let mockRepository: AuthRepository;
  let mockHashingService: HashingService;
  let mockJwtService: JwtService;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      findByProviderId: vi.fn(),
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

    authService = new AuthService(
      mockRepository,
      mockHashingService,
      mockJwtService,
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

    it('debe lanzar UnauthorizedException si la cuenta no tiene contraseña local', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(
        new User({
          id: 'u-oauth',
          email: 'oauth@google.com',
          provider: 'google',
          providerId: 'g-123',
        }),
      );

      await expect(
        authService.login({
          email: 'oauth@google.com',
          password: 'SomePassword123',
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

  describe('validateOAuthLogin', () => {
    it('debe autenticar al usuario existente por providerId y actualizar foto/nombre', async () => {
      const existingUser = new User({
        id: 'u-existing',
        email: 'user@gmail.com',
        provider: 'google',
        providerId: 'gid-123',
        name: 'Nombre Anterior',
      });

      vi.mocked(mockRepository.findByProviderId).mockResolvedValue(existingUser);
      vi.mocked(mockRepository.update).mockResolvedValue(
        new User({
          id: 'u-existing',
          email: 'user@gmail.com',
          provider: 'google',
          providerId: 'gid-123',
          name: 'Nombre Actualizado',
          picture: 'https://new-pic.jpg',
        }),
      );

      const result = await authService.validateOAuthLogin({
        provider: 'google',
        providerId: 'gid-123',
        email: 'user@gmail.com',
        name: 'Nombre Actualizado',
        picture: 'https://new-pic.jpg',
      });

      expect(result.accessToken).toBe('jwt_mock_token');
      expect(result.user.name).toBe('Nombre Actualizado');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('debe vincular la cuenta OAuth si el usuario ya existe por email', async () => {
      const existingLocalUser = new User({
        id: 'u-local',
        email: 'dev@github.com',
        provider: 'local',
        passwordHash: 'hash',
        name: 'Dev Local',
      });

      vi.mocked(mockRepository.findByProviderId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(existingLocalUser);
      vi.mocked(mockRepository.update).mockResolvedValue(
        new User({
          id: 'u-local',
          email: 'dev@github.com',
          provider: 'github',
          providerId: 'gh-456',
          name: 'Dev Local',
          picture: 'https://avatar.github.com',
        }),
      );

      const result = await authService.validateOAuthLogin({
        provider: 'github',
        providerId: 'gh-456',
        email: 'dev@github.com',
        name: 'Dev GitHub',
        picture: 'https://avatar.github.com',
      });

      expect(result.accessToken).toBe('jwt_mock_token');
      expect(mockRepository.update).toHaveBeenCalledWith('u-local', {
        provider: 'github',
        providerId: 'gh-456',
        name: 'Dev Local',
        picture: 'https://avatar.github.com',
      });
    });

    it('debe crear un nuevo usuario si no existe ni por providerId ni por email', async () => {
      vi.mocked(mockRepository.findByProviderId).mockResolvedValue(null);
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(
        new User({
          id: 'u-brand-new',
          email: 'newuser@google.com',
          provider: 'google',
          providerId: 'g-789',
          name: 'Nuevo Usuario',
          picture: 'https://google.com/pic.png',
        }),
      );

      const result = await authService.validateOAuthLogin({
        provider: 'google',
        providerId: 'g-789',
        email: 'newuser@google.com',
        name: 'Nuevo Usuario',
        picture: 'https://google.com/pic.png',
      });

      expect(result.accessToken).toBe('jwt_mock_token');
      expect(result.user.email).toBe('newuser@google.com');
      expect(mockRepository.create).toHaveBeenCalledWith({
        email: 'newuser@google.com',
        provider: 'google',
        providerId: 'g-789',
        name: 'Nuevo Usuario',
        picture: 'https://google.com/pic.png',
      });
    });
  });
});
