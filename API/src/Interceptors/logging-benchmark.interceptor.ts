import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';

@Injectable()
export class LoggingBenchmarkInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingBenchmarkInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`[${className}] ${handlerName} +${duration}ms`);
      }),
    );
  }
}
