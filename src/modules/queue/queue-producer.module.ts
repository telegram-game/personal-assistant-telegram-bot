import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  BUILD_MODEL_QUEUE,
  PREDICT_MESSAGE_QUEUE,
  QUEUE_PREFIX,
  TELEGRAM_MESSAGE_QUEUE,
} from 'src/constants';
import { CachingModule } from '../caching';
import { ConfigService } from '@nestjs/config';
import { TelegramMessageProducer } from './producer/telegram-message-producer';
import { BuildModelProducer } from './producer/build-model-producer';
import { PredictMessageProducer } from './producer/predict-message-producer';

@Module({
  imports: [
    CachingModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options = {
          redisHost: configService.get<string>('redisHost'),
          redisPort: configService.get<number>('redisPort'),
        };
        return {
          prefix: QUEUE_PREFIX,
          redis: {
            host: options.redisHost,
            port: options.redisPort,

            reconnectOnError(err) {
              const targetError = 'MOVED';
              if (err.message.includes(targetError)) {
                // Only reconnect reconnect and resend the failed command after reconnection. when the error contains "MOVED"
                return 2;
              }
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: TELEGRAM_MESSAGE_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    BullModule.registerQueue({
      name: BUILD_MODEL_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    BullModule.registerQueue({
      name: PREDICT_MESSAGE_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  providers: [
    TelegramMessageProducer,
    BuildModelProducer,
    PredictMessageProducer,
  ],
  exports: [
    TelegramMessageProducer,
    BuildModelProducer,
    PredictMessageProducer,
  ],
})
export class QueueProducerModule {}
