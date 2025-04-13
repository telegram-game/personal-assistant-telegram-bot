import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { HealthModule } from '../modules/health';
import { LoggerModule } from '../modules/loggers';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CoreResponseInterceptor, LoggingInterceptor } from '../interceptors';
import { CoreExceptionFilter } from '../filters';
import {
  ConfigurableModuleClass,
  MODULE_ASYNC_OPTIONS_TYPE,
  MODULE_OPTIONS_TYPE,
} from '../constants';
import { RequestContextMiddleware } from '../middlewares';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { HttpModule } from 'src/modules/http';

@Module({
  imports: [
    HealthModule,
    LoggerModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    HttpModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CoreResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CoreExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          validationError: {
            target: false,
            value: false,
          },
          stopAtFirstError: true,
        }),
    },
  ],
})
export class CoreAppModule
  extends ConfigurableModuleClass
  implements NestModule
{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
  static forRoot(options: typeof MODULE_OPTIONS_TYPE): DynamicModule {
    return {
      ...super.forRoot(options),
    };
  }

  static forRootAsync(
    options: typeof MODULE_ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    return {
      ...super.forRootAsync(options),
    };
  }
}
