/* oxlint-disable typescript/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService as NestJwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../Domain/Entities/roles.enum.js';
import { User } from '../../Domain/Entities/user.entity.js';
import type { AuthRepository } from '../../Domain/interfaces/auth-repository.interface.js';
import type { HashingService } from './hashing.service.js';
import { HashingServiceAdapter } from './hashingservice.adapter.js';
import { getJwtExpiresIn, getJwtSecret } from './jwt.constants.js';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtServiceAdapter } from './jwtservice.adapter.js';

describe('Auth Security (JwtStrategy, Constants & Adapters) (Unit)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('jwt.constants', () => {
    it('usa valores por defecto en desarrollo y exige JWT_SECRET en producción', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'test';
      expect(getJwtSecret()).toBe('dev-only-insecure-secret-change-me');
      expect(getJwtExpiresIn()).toBe('1d');

      process.env.NODE_ENV = 'production';
      expect(() => getJwtSecret()).toThrow('JWT_SECRET no está definido');

      process.env.JWT_SECRET = 'prod-secret';
      process.env.JWT_EXPIRES_IN = '12h';
      expect(getJwtSecret()).toBe('prod-secret');
      expect(getJwtExpiresIn()).toBe('12h');
    });
  });

  describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let authRepo: AuthRepository;

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      JwtStrategy.clearUserCache();
      authRepo = {
        findByEmail: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      };
      strategy = new JwtStrategy(authRepo);
    });

    it('validate cachea el usuario durante el TTL y solo consulta la BD 1 vez en peticiones seguidas', async () => {
      const user = new User({
        id: 'u-1',
        email: 'admin@sotano.com',
        name: 'Admin',
        role: Role.ADMIN,
      });
      vi.mocked(authRepo.findById).mockResolvedValue(user);

      const first = await strategy.validate({
        sub: 'u-1',
        email: 'admin@sotano.com',
        role: Role.ADMIN,
      });
      const second = await strategy.validate({
        sub: 'u-1',
        email: 'admin@sotano.com',
        role: Role.ADMIN,
      });

      expect(authRepo.findById).toHaveBeenCalledTimes(1);
      expect(first).toEqual({
        id: 'u-1',
        userId: 'u-1',
        email: 'admin@sotano.com',
        role: Role.ADMIN,
        name: 'Admin',
        provider: 'local',
        picture: undefined,
      });
      expect(second.userId).toBe('u-1');

      JwtStrategy.invalidateUserCache('u-1');
      await strategy.validate({
        sub: 'u-1',
        email: 'admin@sotano.com',
        role: Role.ADMIN,
      });
      expect(authRepo.findById).toHaveBeenCalledTimes(2);
    });

    it('validate lanza UnauthorizedException si el usuario no existe', async () => {
      vi.mocked(authRepo.findById).mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'u-missing', email: 'x@y.com', role: Role.USER }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('validate lanza UnauthorizedException si el rol cambió desde la emisión del JWT', async () => {
      vi.mocked(authRepo.findById).mockResolvedValue(
        new User({ id: 'u-1', email: 'a@b.com', role: Role.USER }),
      );

      await expect(
        strategy.validate({ sub: 'u-1', email: 'a@b.com', role: Role.ADMIN }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('extrae el JWT de la cookie access_token o del header Bearer', () => {
      const extractor = (
        strategy as unknown as { _jwtFromRequest: (req: Request) => string | null }
      )._jwtFromRequest;

      const reqCookie = { cookies: { access_token: 'cookie-jwt' }, headers: {} } as unknown as Request;
      expect(extractor(reqCookie)).toBe('cookie-jwt');

      const reqBearer = {
        cookies: {},
        headers: { authorization: 'Bearer header-jwt' },
      } as unknown as Request;
      expect(extractor(reqBearer)).toBe('header-jwt');
    });
  });

  describe('Security Adapters', () => {
    it('HashingServiceAdapter y JwtServiceAdapter delegan correctamente', async () => {
      const hashingMock = {
        hash: vi.fn().mockResolvedValue('h'),
        compare: vi.fn().mockResolvedValue(true),
      } as unknown as HashingService;
      const hashingAdapter = new HashingServiceAdapter(hashingMock);
      await expect(hashingAdapter.hash('abc')).resolves.toBe('h');
      await expect(hashingAdapter.compare('abc', 'h')).resolves.toBe(true);

      const nestJwtMock = {
        signAsync: vi.fn().mockResolvedValue('tok'),
      } as unknown as NestJwtService;
      const jwtAdapter = new JwtServiceAdapter(nestJwtMock);
      await expect(
        jwtAdapter.signAsync({ sub: '1', email: 'a@b.com', role: Role.USER }),
      ).resolves.toBe('tok');
    });
  });
});
