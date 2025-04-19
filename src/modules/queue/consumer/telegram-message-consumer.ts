import { Processor } from '@nestjs/bull';
import { DoneCallback, Job } from 'bull';
import { BaseConsumer } from './base-consumer';
import { TELEGRAM_MESSAGE_QUEUE } from 'src/constants';
import { TelegramMessage } from '../models/telegram-message.model';
import { DataService } from 'src/modules/shared/services/data-service.service';

@Processor(TELEGRAM_MESSAGE_QUEUE)
export class TelegramMessageConsumer extends BaseConsumer<TelegramMessage> {
  constructor(private readonly dataService: DataService) {
    super();
    this.logger.log('UpdateLeaderBoardConsumer created');
  }

  async handleMessage(
    job: Job<TelegramMessage>,
    done: DoneCallback,
  ): Promise<void> {
    try {
      await this.dataService.sendTelegramBotMessageInternal(job.data);

      this.logger.info(`handled message:- messageId:${job.id}`);

      // Handle async case
      if (typeof done === 'function') {
        done();
      }
    } catch (err) {
      this.logger.error(`error handling message - messageId:${job.id}`, err);

      // Handle async case
      if (typeof done !== 'function') {
        throw err;
      }

      done(err);
    }
  }
}
