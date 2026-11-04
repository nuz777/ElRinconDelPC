import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-request-id';
export const ALT_CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingId =
      req.headers[CORRELATION_ID_HEADER] ??
      req.headers[ALT_CORRELATION_ID_HEADER];

    const correlationId =
      typeof existingId === 'string' && existingId.trim().length > 0
        ? existingId.trim()
        : Array.isArray(existingId) && existingId[0]
          ? existingId[0].trim()
          : randomUUID();

    req.headers[CORRELATION_ID_HEADER] = correlationId;
    req.headers[ALT_CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
