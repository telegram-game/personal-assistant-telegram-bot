import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { instanceToPlain } from 'class-transformer';
import { Request } from 'express';
import { map } from 'rxjs';
import { CID_HEADER_KEY } from 'src/constants';
import { IGNORE_CORE_RESPONSE_KEY } from 'src/decorators';
import { CoreResponse } from 'src/interfaces';
import { SuccessResponse } from 'src/models';
import { formatMilliseconds } from 'src/utils';

@Injectable()
export class CoreResponseInterceptor<T>
  implements NestInterceptor<T, Partial<CoreResponse<T>>>
{
  constructor(public readonly reflector: Reflector) {}
  private checkExcludeInterceptor(ctx: ExecutionContext) {
    return (
      this.reflector.get(IGNORE_CORE_RESPONSE_KEY, ctx.getClass()) ||
      this.reflector.get(IGNORE_CORE_RESPONSE_KEY, ctx.getHandler())
    );
  }
  intercept(context: ExecutionContext, next: CallHandler<T>) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (this.checkExcludeInterceptor(context)) return data;
        response.header(CID_HEADER_KEY, request.context?.cid);

        return new SuccessResponse<T>({
          data: instanceToPlain(data, {
            strategy: 'exposeAll',
            excludePrefixes: [
              '_',
              '__',
              'createdAt',
              'createdBy',
              'updatedAt',
              'updatedBy',
              'isDeleted',
            ],
            exposeUnsetFields: true,
          }) as T,
          responseTime: formatMilliseconds(
            new Date().getTime() - request.context?.requestTimestamp,
          ),
          timestamp: request.context?.requestTimestamp,
        });
      }),
    );
  }
}
