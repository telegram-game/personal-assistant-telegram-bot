import { Process } from '@nestjs/bull';
import { DoneCallback, Job } from 'bull';
import { RequestContext } from 'src/models';
import { Logger } from 'src/modules/loggers';
import asyncLocalStorage from 'src/storage/async_local';
import { BaseMessage } from '../models/message-base.model';

export abstract class BaseConsumer<TMesssage extends BaseMessage> {
  protected readonly logger = new Logger(this.constructor.name);

  @Process()
  protected async executeProcess(
    job: Job<TMesssage>,
    done: DoneCallback,
  ): Promise<void> {
    // For this cid, we keep the cid is the same for every time if we retry the job
    const ctx = new RequestContext({
      cid: job.data.cid,
    });

    return await asyncLocalStorage.run(ctx, async () => {
      await this.handleMessage(job, done);
    });
  }

  abstract handleMessage(
    job: Job<TMesssage>,
    done: DoneCallback,
  ): Promise<void>;
}
