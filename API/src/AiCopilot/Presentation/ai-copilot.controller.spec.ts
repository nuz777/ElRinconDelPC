/* oxlint-disable typescript/unbound-method */
import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../../Auth/Infraestructure/security/jwt.strategy.js';
import {
  JwtAuthGuard,
  Role,
  ROLES_KEY,
  RolesGuard,
} from '../../Guards/index.js';
import { AiProvider } from '../Domain/ai-provider.enum.js';
import type { AiCopilotService } from '../Application/Services/ai-copilot.service.js';
import { AiCopilotController } from './ai-copilot.controller.js';

type AuthReq = Request & { user: AuthenticatedUser };

describe('AiCopilotController (Unit)', () => {
  let controller: AiCopilotController;
  let aiCopilotService: AiCopilotService;

  beforeEach(() => {
    aiCopilotService = {
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      deleteConfig: vi.fn(),
      autocomplete: vi.fn(),
    } as unknown as AiCopilotService;

    controller = new AiCopilotController(aiCopilotService);
  });

  it('protege el controlador con JwtAuthGuard, RolesGuard y @Roles(Role.ADMIN)', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AiCopilotController,
    ) as unknown[];
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      AiCopilotController,
    ) as Role[];

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
    expect(roles).toEqual([Role.ADMIN]);

    const rolesGuard = new RolesGuard(new Reflector());
    const userContext = {
      getHandler: () => controller.getConfig,
      getClass: () => AiCopilotController,
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 'u-1', role: Role.USER } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => rolesGuard.canActivate(userContext)).toThrowError(
      ForbiddenException,
    );
  });

  it('delega getConfig, saveConfig, deleteConfig y autocomplete usando req.user.id', async () => {
    const req = {
      user: {
        id: 'admin-uuid',
        userId: 'admin-uuid',
        email: 'admin@sotano.pc',
        role: Role.ADMIN,
      },
    } as AuthReq;

    vi.mocked(aiCopilotService.getConfig).mockResolvedValue({
      hasKey: false,
      provider: AiProvider.GEMINI,
      maskedKey: null,
    });
    await expect(controller.getConfig(req)).resolves.toEqual({
      hasKey: false,
      provider: AiProvider.GEMINI,
      maskedKey: null,
    });
    expect(aiCopilotService.getConfig).toHaveBeenCalledWith('admin-uuid');

    const savePayload = { provider: AiProvider.NVIDIA, apiKey: 'nvapi-123456' };
    await controller.saveConfig(req, savePayload);
    expect(aiCopilotService.saveConfig).toHaveBeenCalledWith(
      'admin-uuid',
      savePayload,
    );

    await controller.deleteConfig(req);
    expect(aiCopilotService.deleteConfig).toHaveBeenCalledWith('admin-uuid');

    const autoPayload = { title: 'Celeste', section: 'JUEGOS' };
    await controller.autocomplete(req, autoPayload);
    expect(aiCopilotService.autocomplete).toHaveBeenCalledWith(
      'admin-uuid',
      autoPayload,
    );
  });
});
