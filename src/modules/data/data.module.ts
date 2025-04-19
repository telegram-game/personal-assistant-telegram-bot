import { Module } from '@nestjs/common';
import { TelegramMessageController } from './controllers/telegram-message.internal.controller';
import { PrismaModule } from '../prisma';
import { TelegramMessageRepository } from './repositories/telegram-message.repository';
import { TelegramMessageService } from './services/telegram-message.service';
import { QueueProducerModule } from '../queue';
import { QueueConsumerModule } from '../queue/queue-consumer.module';
import { SharedModule } from '../shared/shared.module';
import { TrainDataRepository } from './repositories/train-data.repository';
import { AIModelRepository } from './repositories/ai-model.repository';
import { AIModelService } from './services/ai-model.service';
import { AIModelController } from './controllers/ai-model.internal.controller';
import { TrainDataController } from './controllers/train-data.internal.controller';
import { TrainDataService } from './services/train-data.service';

@Module({
  imports: [PrismaModule, QueueProducerModule, SharedModule],
  controllers: [
    TelegramMessageController,
    AIModelController,
    TrainDataController,
  ],
  providers: [
    TelegramMessageRepository,
    TelegramMessageService,
    TrainDataRepository,
    TrainDataService,
    AIModelRepository,
    AIModelService,
  ],
})
export class DataModule {}

@Module({
  imports: [QueueProducerModule, QueueConsumerModule],
  controllers: [],
  providers: [],
})
export class DataConsumerModule {}
