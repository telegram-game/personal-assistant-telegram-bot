import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Logger } from 'src/modules/loggers';
import { formatMilliseconds } from 'src/utils';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const requestContext = request.context;

    this.logger.info(
      `Accepted Request [${requestContext.cid}] - ${request.url} - ${request.method}`,
      {
        method: request.method,
        url: request.url,
      },
      LoggingInterceptor.name,
    );

    return next.handle().pipe(
      tap(() => {
        const executionTime = Math.round(
          new Date().getTime() - requestContext.requestTimestamp,
        );
        return this.logger.info(
          `Response [${requestContext.cid}] - [${response.statusCode}]: ${formatMilliseconds(executionTime)}`,
          {
            executionTime,
            statusCode: response.statusCode,
          },
          LoggingInterceptor.name,
        );
      }),
      catchError((err) => {
        const executionTime = Math.round(
          new Date().getTime() - requestContext.requestTimestamp,
        );

        this.logger.error(
          `Exception  [${requestContext.cid}] - [${err.status ?? HttpStatus.INTERNAL_SERVER_ERROR}]: ${err.message ?? err.errorMessage}`,
          err.stack,
          LoggingInterceptor.name,
          {
            executionTime,
            errorCode: err.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          },
        );
        return throwError(() => err);
      }),
    );
  }
}
