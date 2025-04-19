import { TelegramSender } from 'src/models/telegram-sender.model';

export enum TelegramMessageType {
  ASK = 'ASK',
  TRAIN = 'TRAIN',
  APPROVE = 'APPROVE',
  START_TRAIN = 'START_TRAIN',
}

export class TelegramMessageRequestPayload {
  type: TelegramMessageType;
  chatId: string;
  messageId: string;
  message: string;
  originalMessage: string;
  sender: TelegramSender;
}
