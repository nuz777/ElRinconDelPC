/* oxlint-disable typescript/unbound-method */
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthService } from '../Application/Services/auth.service.js';
import { Role } from '../Domain/Entities/roles.enum.js';
import type { AuthenticatedUser } from '../Infraestructure/security/jwt.strategy.js';
import { AuthController } from './auth.controller.js';

const USER_DTO = {
  id: 'u-1',
  name: 'Nuz',
  email: 'nuz@sotano.com',
  provider: 'local' as const,
  role: Role.USER,
};

describe('AuthController (Unit)', () => {
  let controller: AuthController;
  let authService: AuthService;
  let res: Response;

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      login: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      getUserSession: vi.fn(),
    } as unknown as AuthService;

    res = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    controller = new AuthController(authService);
  });

  it('register y login establecen cookie httpOnly y retornan { user, token }', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      accessToken: 'jwt-1',
      user: USER_DTO,
    });
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'jwt-2',
      user: USER_DTO,
    });

    const reg = await controller.register(
      { name: 'Nuz', email: 'nuz@sotano.com', password: 'Password123!' },
      res,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'jwt-1',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(reg).toEqual({ user: USER_DTO, token: 'jwt-1' });

    const log = await controller.login(
      { email: 'nuz@sotano.com', password: 'Password123!' },
      res,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'jwt-2',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(log).toEqual({ user: USER_DTO, token: 'jwt-2' });
  });

  it('forgotPassword, resetPassword, adminOnly y logout delegan correctamente', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'enviado' });
    vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'ok' });

    await expect(controller.forgotPassword({ email: 'nuz@sotano.com' })).resolves.toEqual({
      message: 'enviado',
    });
    await expect(
      controller.resetPassword({
        email: 'nuz@sotano.com',
        code: '123456',
        newPassword: 'Password123!',
      }),
    ).resolves.toEqual({ message: 'ok' });

    const req = {
      user: { id: 'u-1', userId: 'u-1', email: 'admin@sotano.com', role: Role.ADMIN },
    } as unknown as Request & { user: AuthenticatedUser };
    expect(controller.adminOnly(req)).toMatchObject({ user: req.user });

    expect(controller.logout(res)).toEqual({
      statusCode: 200,
      message: 'Sesión cerrada correctamente',
    });
    expect(res.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });

  it('check devuelve la sesión desde req.user sin volver a consultar la BD', () => {
    const authUser: AuthenticatedUser = {
      id: 'u-1',
      userId: 'u-1',
      email: 'nuz@sotano.com',
      role: Role.USER,
      name: 'Nuz',
      provider: 'local',
    };
    const req = { user: authUser } as unknown as Request & { user: AuthenticatedUser };

    const result = controller.check(req);

    expect(authService.getUserSession).not.toHaveBeenCalled();
    expect(result).toEqual({
      authenticated: true,
      user: {
        id: 'u-1',
        name: 'Nuz',
        email: 'nuz@sotano.com',
        provider: 'local',
        role: Role.USER,
        picture: undefined,
      },
    });
  });
});
