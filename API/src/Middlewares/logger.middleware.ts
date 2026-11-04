import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from './correlation-id.middleware.js';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

    res.on('finish', () => {
      const { statusCode } = res;
      const requestIdHeader =
        req.headers[CORRELATION_ID_HEADER] ??
        res.getHeader(CORRELATION_ID_HEADER);
      const requestId =
        typeof requestIdHeader === 'string' ? requestIdHeader : 'N/A';

      const message = `[${requestId}] ${method} ${originalUrl} ${statusCode} - IP: ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
