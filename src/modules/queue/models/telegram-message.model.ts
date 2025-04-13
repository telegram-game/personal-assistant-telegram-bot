import { QueuePriority } from 'src/constants';
import { BaseMessage } from './message-base.model';
import { TelegramSender } from 'src/models/telegram-sender.model';
import { TelegramMessageType } from 'src/models/telegram-mesage.model';

export type TelegramMessage = BaseMessage & {
    type: TelegramMessageType;
    chatId: string;
    messageId: string;
    message: string;
    originalMessage: string;
    sender: TelegramSender;
};

export type TelegramMessageOptions = {
  priority?: QueuePriority;
};
