import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseTransformInterceptor } from './response-transform.interceptor.js';

describe('Interceptors (Unit)', () => {
  describe('ResponseTransformInterceptor', () => {
    it('debe envolver la respuesta en el formato estándar', async () => {
      const interceptor = new ResponseTransformInterceptor<{ ok: boolean }>();

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ originalUrl: '/auth/login', url: '/auth/login' }),
          getResponse: () => ({ statusCode: 200, headersSent: false }),
        }),
      } as unknown as ExecutionContext;

      const next: CallHandler<{ ok: boolean }> = {
        handle: () => of({ ok: true }),
      };

      const result = await firstValueFrom(interceptor.intercept(context, next));

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual({ ok: true });
      expect(result.path).toBe('/auth/login');
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
