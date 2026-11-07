/* oxlint-disable typescript/unbound-method */
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../Auth/Domain/Entities/roles.enum.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard (Unit)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;
    rolesGuard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: {
    userId: string;
    email: string;
    role?: Role;
  }): ExecutionContext =>
    ({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('debe permitir el acceso si la ruta no especifica roles', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    const context = createMockContext();

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('debe permitir el acceso si el usuario tiene el rol requerido (admin)', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);
    const context = createMockContext({
      userId: 'u-admin',
      email: 'theunrealultranigg@gmail.com',
      role: Role.ADMIN,
    });

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si el rol del usuario no coincide', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);
    const context = createMockContext({
      userId: 'u-user',
      email: 'user@correo.com',
      role: Role.USER,
    });

    expect(() => rolesGuard.canActivate(context)).toThrowError(
      new ForbiddenException('Permisos insuficientes'),
    );
  });

  it('debe lanzar ForbiddenException si no existe usuario en la request', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([Role.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => rolesGuard.canActivate(context)).toThrowError(
      new ForbiddenException('Permisos insuficientes'),
    );
  });
});
