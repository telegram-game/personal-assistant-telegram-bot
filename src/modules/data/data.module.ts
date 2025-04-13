import { Module } from '@nestjs/common';
import { TelegramMessageController } from './controllers/telegram-message.internal.controller';
import { PrismaModule } from '../prisma';
import { TelegramMessageRepository } from './repositories/telegram-message.repository';
import { TelegramMessageService } from './services/telegram-message.service';
import { QueueProducerModule } from '../queue';
import { QueueConsumerModule } from '../queue/queue-consumer.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [PrismaModule, QueueProducerModule, SharedModule],
  controllers: [TelegramMessageController],
  providers: [TelegramMessageRepository, TelegramMessageService],
})
export class DataModule {}

@Module({
    imports: [QueueProducerModule, QueueConsumerModule],
    controllers: [],
    providers: [],
  })
  export class DataConsumerModule {}
