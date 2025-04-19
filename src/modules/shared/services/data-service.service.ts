import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalHttpClientService } from 'src/modules/http';
import { TelegramMessageRequestPayload } from '../models/telegram-message-request.model';

@Injectable()
export class DataService {
  private dataServiceUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly internalHttpClientService: InternalHttpClientService,
  ) {
    this.dataServiceUrl = this.configService.get<string>('dataServiceUrl');
  }

  sendTelegramBotMessage(data: TelegramMessageRequestPayload): Promise<void> {
    return this.internalHttpClientService.post(
      `${this.dataServiceUrl}/internal/api/v1.0/telegram-messsages`,
      data,
    );
  }

  sendTelegramBotMessageInternal(
    data: TelegramMessageRequestPayload,
  ): Promise<void> {
    return this.internalHttpClientService.post(
      `${this.dataServiceUrl}/internal/api/v1.0/telegram-messsages/internal`,
      data,
    );
  }
}
