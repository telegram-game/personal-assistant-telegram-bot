import { Queue } from 'bull';
import { Log, Logger } from 'src/modules/loggers';
import { BaseMessage } from '../models/message-base.model';
import { OnModuleDestroy } from '@nestjs/common';

export abstract class BaseProducer<TMesssage extends BaseMessage>
  implements OnModuleDestroy
{
  protected readonly logger = new Logger(this.constructor.name);
  constructor(protected queueClient: Queue) {}

  @Log()
  onModuleDestroy() {
    this.queueClient.close();
  }

  abstract sendMessage(message: TMesssage, options?: any): Promise<void>;
}
