import { IsEnum, IsObject, IsString } from 'class-validator';
import { TelegramMessageType } from 'src/models/telegram-mesage.model';
import { TelegramSender } from 'src/models/telegram-sender.model';

export class TelegramMessagePayload {
  @IsEnum(TelegramMessageType)
  type: TelegramMessageType;

  @IsString()
  chatId: string;

  @IsString()
  messageId: string;

  @IsString()
  message: string;

  @IsString()
  originalMessage: string;

  @IsObject()
  sender: TelegramSender;
};
