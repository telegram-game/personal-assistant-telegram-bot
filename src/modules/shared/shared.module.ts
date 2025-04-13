import { Global, Module } from '@nestjs/common';
import { HttpModule } from '../http';
import { DataService } from './services/data-service.service';
import { TelegramBotService } from './services/telegram-bot-service.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    DataService,
    TelegramBotService,
  ],
  exports: [
    DataService,
    TelegramBotService,
  ],
})
export class SharedModule {}
