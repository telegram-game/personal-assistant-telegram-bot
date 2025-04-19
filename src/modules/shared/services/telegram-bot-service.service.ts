import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalHttpClientService } from 'src/modules/http';
import { SendMessagePayload } from 'src/models/send-message.model';

@Injectable()
export class TelegramBotService {
  private telegramBotServiceUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly internalHttpClientService: InternalHttpClientService,
  ) {
    this.telegramBotServiceUrl = this.configService.get<string>(
      'telegramBotServiceUrl',
    );
  }

  sendMessage(data: SendMessagePayload): Promise<void> {
    return this.internalHttpClientService.post(
      `${this.telegramBotServiceUrl}/internal/api/v1.0/messages/send`,
      data,
    );
  }
}
