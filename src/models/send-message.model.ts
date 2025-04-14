import { Expose, Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReplyParamenters {
  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  chatId?: string;
}

export class SendMessageOption {
  @IsOptional()
  @IsString()
  messageThreadId?: string;

  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ReplyParamenters)
  replyParameters?: ReplyParamenters;
}

export class SendMessagePayload {
  @IsString()
  chatId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SendMessageOption)
  options?: SendMessageOption;
}
