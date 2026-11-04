import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LoggingBenchmarkInterceptor } from './logging-benchmark.interceptor.js';
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

  describe('LoggingBenchmarkInterceptor', () => {
    it('debe medir la duración y dejar pasar el resultado del handler', async () => {
      const interceptor = new LoggingBenchmarkInterceptor();

      const context = {
        getClass: () => ({ name: 'AuthController' }),
        getHandler: () => ({ name: 'login' }),
      } as unknown as ExecutionContext;

      const next: CallHandler<string> = {
        handle: vi.fn(() => of('resultado')),
      };

      const result = await firstValueFrom(interceptor.intercept(context, next));
      expect(result).toBe('resultado');
    });
  });
});
