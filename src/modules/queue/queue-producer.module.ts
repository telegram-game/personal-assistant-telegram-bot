import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_PREFIX, TELEGRAM_MESSAGE_QUEUE } from 'src/constants';
import { CachingModule } from '../caching';
import { ConfigService } from '@nestjs/config';
import { TelegramMessageProducer } from './producer/telegram-message-producer';

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
  ],
  providers: [TelegramMessageProducer],
  exports: [TelegramMessageProducer],
})
export class QueueProducerModule {}
