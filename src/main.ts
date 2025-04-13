import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger as LoggerService } from 'src/modules/loggers';
import { appProvider } from './applications/app.provider';
import compression from 'compression';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(utc);

async function bootstrap() {
  const startBoootstrapTime = performance.now();

  const app = await NestFactory.create(appProvider.getAppModule(), {
    cors: true,
    logger: new LoggerService(),
    rawBody: true,
  });
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // With the body size is greater than 1kb, the response will be compressed
  app.use(
    compression({
      filter: () => {
        return true;
      },
    }),
  );

  // enable graceful shutdown
  app.enableShutdownHooks();

  const configService = await app.resolve(ConfigService);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port).then(() => {
    const bootstrapTime = Math.round(performance.now() - startBoootstrapTime);
    logger.info(`Application is running on: ${port}`);
    logger.info(
      `Application started with port ${port} in ${bootstrapTime}ms`,
      {
        executionTime: bootstrapTime,
      },
      bootstrap.name,
    );
  });
}
bootstrap();
