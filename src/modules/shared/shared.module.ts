import { Global, Module } from '@nestjs/common';
import { HttpModule } from '../http';
import { DataService } from './services/data-service.service';
import { TelegramBotService } from './services/telegram-bot-service.service';
import { PredictionService } from './services/prediction-service.service';
import { TrainService } from './services/train-service.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [DataService, TelegramBotService, PredictionService, TrainService],
  exports: [DataService, TelegramBotService, PredictionService, TrainService],
})
export class SharedModule {}
