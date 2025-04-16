import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  TelegramMessage,
  TelegramMessageOptions,
} from '../models/telegram-message.model';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseProducer } from './base-producer';
import { QueuePriority, BUILD_MODEL_QUEUE } from 'src/constants';
import { BuildModel, BuildModelOptions } from '../models/build-model.model';

@Injectable()
export class BuildModelProducer extends BaseProducer<BuildModel> {
  constructor(@InjectQueue(BUILD_MODEL_QUEUE) queueClient: Queue) {
    super(queueClient);
  }
  async sendMessage(
    message: BuildModel,
    options?: BuildModelOptions,
  ): Promise<void> {
    const jobId = uuidv4();
    this.logger.info('sending message:', message, this.sendMessage.name);
    await this.queueClient.add(message, {
      jobId,
      attempts: 10, // hard code retry to 10 times
      backoff: 10000, // 10 seconds
      priority: options?.priority || QueuePriority.Normal,
    });
    this.logger.info('sent message:', message, this.sendMessage.name);
  }
}
