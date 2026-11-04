import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, map } from 'rxjs';

export interface ApiStandardResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiStandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiStandardResponse<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data: T): ApiStandardResponse<T> => {
        // Si el controlador ya envió la respuesta manualmente con @Res() (ej. redirecciones OAuth)
        if (response.headersSent) {
          return data as unknown as ApiStandardResponse<T>;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          data,
          timestamp: new Date().toISOString(),
          path: request.originalUrl || request.url,
        };
      }),
    );
  }
}
