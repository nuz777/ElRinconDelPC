import type { NextFunction, Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import {
  CORRELATION_ID_HEADER,
  CorrelationIdMiddleware,
} from './correlation-id.middleware.js';
import { LoggerMiddleware } from './logger.middleware.js';

describe('Middlewares (Unit)', () => {
  describe('CorrelationIdMiddleware', () => {
    const middleware = new CorrelationIdMiddleware();

    it('debe generar un UUID v4 cuando no viene x-request-id ni x-correlation-id', () => {
      const req = { headers: {} } as unknown as Request;
      const setHeader = vi.fn();
      const res = { setHeader } as unknown as Response;
      const next: NextFunction = vi.fn();

      middleware.use(req, res, next);

      const generatedId = req.headers[CORRELATION_ID_HEADER];
      expect(typeof generatedId).toBe('string');
      expect((generatedId as string).length).toBeGreaterThan(10);
      expect(setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        generatedId,
      );
      expect(next).toHaveBeenCalledOnce();
    });

    it('debe reutilizar el header x-request-id existente', () => {
      const req = {
        headers: { 'x-request-id': 'custom-req-123' },
      } as unknown as Request;
      const setHeader = vi.fn();
      const res = { setHeader } as unknown as Response;
      const next: NextFunction = vi.fn();

      middleware.use(req, res, next);

      expect(req.headers[CORRELATION_ID_HEADER]).toBe('custom-req-123');
      expect(setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        'custom-req-123',
      );
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('LoggerMiddleware', () => {
    it('debe registrar la petición cuando la respuesta emite el evento finish', () => {
      const middleware = new LoggerMiddleware();
      const req = {
        method: 'GET',
        originalUrl: '/auth/admin/only',
        ip: '127.0.0.1',
        headers: { 'x-request-id': 'req-abc' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const emitter = new EventEmitter();
      const res = Object.assign(emitter, {
        statusCode: 200,
        getHeader: vi.fn().mockReturnValue('req-abc'),
      }) as unknown as Response;

      const next: NextFunction = vi.fn();

      middleware.use(req, res, next);
      expect(next).toHaveBeenCalledOnce();

      emitter.emit('finish');
    });
  });
});
