import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseProducer } from './base-producer';
import { PREDICT_MESSAGE_QUEUE, QueuePriority } from 'src/constants';
import { PredictMessage, PredictMessageOptions } from '../models/predict-message.model';

@Injectable()
export class PredictMessageProducer extends BaseProducer<PredictMessage> {
  constructor(@InjectQueue(PREDICT_MESSAGE_QUEUE) queueClient: Queue) {
    super(queueClient);
  }
  async sendMessage(
    message: PredictMessage,
    options?: PredictMessageOptions,
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
