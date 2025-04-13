import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import { TelegramMessagePayload } from '../models/telegram-message.model';
import { TelegramMessageRepository } from '../repositories/telegram-message.repository';
import { TelegramMessageProducer } from 'src/modules/queue/producer/telegram-message-producer';
import { TelegramBotMessages } from '@prisma/client';
import { TelegramBotService } from 'src/modules/shared/services/telegram-bot-service.service';
import { PrismaService } from 'src/modules/prisma';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private readonly approveChatId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly telegramMessageRepository: TelegramMessageRepository,
    private readonly telegramMessageProducer: TelegramMessageProducer,
    private readonly telegramBotService: TelegramBotService,
    private readonly prismaService: PrismaService,
  ) {
    this.approveChatId = this.configService.get<string>('approveChatId');
   }

  public async receiveTelegramMessageProcess(
    data: TelegramMessagePayload,
    cid: string,
  ): Promise<void> {
    await this.telegramMessageProducer.sendMessage({
      ...data,
      cid,
    })
  }

  public async receiveTelegramMessageInternalProcess(data: TelegramMessagePayload): Promise<void> {
    switch (data.type) {
      case 'TRAIN':
        await this.processTrainType(data);
        break;
      default:
        break;
    }
  }

  private async processTrainType(
    data: TelegramMessagePayload,
  ): Promise<void> {
    const existedData = await this.telegramMessageRepository.checkTrainDuplicate(data.message);
    if (existedData) {
      const errMessage = `Duplicate train data by ${existedData.sender.username ?? ''} (${existedData.sender.first_name ?? ''} ${existedData.sender.last_name ?? ''}) at ${existedData.createdAt}`;
      console.log({
        chatId: data.chatId,
        message: errMessage,
        options: {
          reply_parameters: {
            message_id: data.messageId,
            chat_id: data.chatId,
          }
        },
      });
      await this.telegramBotService.sendMessage({
        chatId: data.chatId,
        message: errMessage,
        options: {
          reply_parameters: {
            messageId: data.messageId,
            chatId: data.chatId,
          }
        },
      })
      return;
    }

    await this.prismaService.transaction(async () => {
      const message = await this.storeMessage(data);
      const approvalMessage = `[${message.id}] Data train (need to be approved) by ${message.sender.username ?? ''} (${message.sender.first_name ?? ''} ${message.sender.last_name ?? ''}): "${message.typeMessage}"`;
      console.log({
        chatId: this.approveChatId,
        message: approvalMessage,
        options: {
          message_thread_id: data.messageId,
        },
      });
      await this.telegramBotService.sendMessage({
        chatId: this.approveChatId,
        message: approvalMessage,
        options: {
          messageThreadId: data.messageId,
        },
      });
    }, [this.telegramMessageRepository]);
  }

  private async storeMessage(data: TelegramMessagePayload): Promise<TelegramBotMessages> {
    return await this.telegramMessageRepository.create({
      type: data.type,
      messageId: data.messageId,
      chatId: data.chatId,
      text: data.originalMessage,
      typeMessage: data.message,
      sender: data.sender,
      createdAt: new Date(),
    });
  }
}