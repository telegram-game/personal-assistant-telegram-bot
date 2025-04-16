import { RequestContext } from 'src/models';
import { TelegramSender as TelegramSenderDto } from 'src/models/telegram-sender.model';
import { AITrainMetaData as AITrainMetaDataDto } from 'src/models/ai-train-metadata.model';

declare global {
  // eslint-disable-next-line  @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      context: RequestContext;
      rawBody: Buffer;
    }
  }

  // eslint-disable-next-line  @typescript-eslint/no-namespace
  namespace PrismaJson {
    export interface TelegramSender extends TelegramSenderDto {}
    export interface AITrainMetaData extends AITrainMetaDataDto {}
  }
}
