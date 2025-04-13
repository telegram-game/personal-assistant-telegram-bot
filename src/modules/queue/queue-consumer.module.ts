import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QUEUE_PREFIX, TELEGRAM_MESSAGE_QUEUE } from 'src/constants';
import { TelegramMessageConsumer } from './consumer/telegram-message-consumer';
import { DataService } from '../shared/services/data-service.service';
import { InternalHttpClientService, SINGLE_INTERNAL_HTTP_CLIENT } from '../http';
import { TelegramBotService } from '../shared/services/telegram-bot-service.service';

@Module({
  imports: [
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
    }),
  ],
  providers: [
    TelegramMessageConsumer,
    {
      provide: DataService,
      useFactory(configService: ConfigService, internalHttpClientService: InternalHttpClientService) {
        const dataService = new DataService(configService, internalHttpClientService);
        return dataService;
      },
      inject: [ConfigService, SINGLE_INTERNAL_HTTP_CLIENT],
    },
    {
      provide: TelegramBotService,
      useFactory(configService: ConfigService, internalHttpClientService: InternalHttpClientService) {
        const telegramBotService = new TelegramBotService(configService, internalHttpClientService);
        return telegramBotService;
      },
      inject: [ConfigService, SINGLE_INTERNAL_HTTP_CLIENT],
    }
  ],
})
export class QueueConsumerModule {}
