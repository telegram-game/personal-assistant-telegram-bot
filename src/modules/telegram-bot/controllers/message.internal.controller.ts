import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TelegramService } from '../services/telegram.service';
import { SendMessagePayload } from 'src/models/send-message.model';

@Controller({
  path: ['/internal/api/v1.0/messages'],
  version: ['1.0'],
})
export class TelegramMessageController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async send(
    @Body() data: SendMessagePayload,
  ): Promise<void> {
    await this.telegramService.send(data.chatId, data.message, {
      reply_parameters: data.options?.replyParameters ? {
        message_id: data.options.replyParameters?.messageId,
        chat_id: data.options.replyParameters?.chatId,
      } : undefined,
      reply_to_message_id: data.options?.replyToMessageId,
      message_thread_id: data.options?.messageThreadId,
    });
  }
}
