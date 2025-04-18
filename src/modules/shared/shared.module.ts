import { Global, Module } from '@nestjs/common';
import { HttpModule } from '../http';
import { DataService } from './services/data-service.service';
import { TelegramBotService } from './services/telegram-bot-service.service';
import { PredictionService } from './services/prediction-service.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    DataService,
    TelegramBotService,
    PredictionService,
  ],
  exports: [
    DataService,
    TelegramBotService,
    PredictionService,
  ],
})
export class SharedModule {}
