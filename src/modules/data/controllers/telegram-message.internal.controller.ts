import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TelegramMessagePayload } from '../models/telegram-message.model';
import { TelegramMessageService } from '../services/telegram-message.service';
import asyncLocalStorage from 'src/storage/async_local';

@Controller({
  path: ['/internal/api/v1.0/telegram-messsages'],
  version: ['1.0'],
})
export class TelegramMessageController {
  constructor(
    private readonly telegramMessageService: TelegramMessageService,
  ) {}

  @Post('')
  @HttpCode(HttpStatus.ACCEPTED)
  async send(
    @Body() data: TelegramMessagePayload,
  ): Promise<void> {
    const cid = asyncLocalStorage.getStore().cid;
    await this.telegramMessageService.receiveTelegramMessageProcess(data, cid);
  }

  @Post('internal')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendInternal(
    @Body() data: TelegramMessagePayload,
  ): Promise<void> {
    await this.telegramMessageService.receiveTelegramMessageInternalProcess(data);
  }
}
