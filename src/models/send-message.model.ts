import { Expose } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReplyParamenters {
  @IsOptional()
  @IsString()
  @Expose({ name: 'message_id' })
  messageId?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'chat_id' })
  chatId?: string;
}

export class SendMessageOption {
  @IsOptional()
  @IsString()
  @Expose({ name: 'message_thread_id' })
  messageThreadId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  reply_parameters?: ReplyParamenters;
}

export class SendMessagePayload {
  @IsString()
  chatId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  options?: SendMessageOption;
}
