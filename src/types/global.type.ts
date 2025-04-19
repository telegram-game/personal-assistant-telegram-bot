import { RequestContext } from 'src/models';
import { TelegramSender as TelegramSenderDto } from 'src/models/telegram-sender.model';

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
    // eslint-disable-next-line  @typescript-eslint/no-empty-object-type
    export interface TelegramSender extends TelegramSenderDto {}
  }
}
