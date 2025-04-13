import { Module } from '@nestjs/common';
import { TelegramService } from './services/telegram.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule, InternalHttpClientService, SINGLE_INTERNAL_HTTP_CLIENT } from 'src/modules/http';
import { DataService } from '../shared/services/data-service.service';
import { TelegramMessageController } from './controllers/message.internal.controller';
@Module({
  imports: [HttpModule],
  controllers: [TelegramMessageController],
  providers: [
    {
      provide: DataService,
      useFactory(configService: ConfigService, internalHttpClientService: InternalHttpClientService) {
        const dataService = new DataService(configService, internalHttpClientService);
        return dataService;
      },
      inject: [ConfigService, SINGLE_INTERNAL_HTTP_CLIENT],
    },
    {
      provide: TelegramService,
      useFactory(configService: ConfigService, dataService: DataService) {
        const appName = configService.get<string>('appName');
        if (appName !== 'TELEGRAM_BOT_SERVICE') {
          return null;
        }
        const telegramService = new TelegramService(configService, dataService);
        return telegramService;
      },
      inject: [ConfigService, DataService],
    }
  ],
})
export class TelegramBotModule {}
