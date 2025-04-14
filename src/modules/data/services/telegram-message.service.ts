import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import { TelegramMessagePayload } from '../models/telegram-message.model';
import { TelegramMessageRepository } from '../repositories/telegram-message.repository';
import { TelegramMessageProducer } from 'src/modules/queue/producer/telegram-message-producer';
import { TelegramBotMessages, TrainDataStatus } from '@prisma/client';
import { TelegramBotService } from 'src/modules/shared/services/telegram-bot-service.service';
import { PrismaService } from 'src/modules/prisma';
import { ConfigService } from '@nestjs/config';
import { TrainDataRepository } from '../repositories/train-data.repository';
import { TelegramMessageType } from 'src/models/telegram-mesage.model';

@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private readonly approveChatId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly telegramMessageRepository: TelegramMessageRepository,
    private readonly trainDataRepository: TrainDataRepository,
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
      case 'APPROVE':
        await this.processApproveType(data);
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
      await this.telegramBotService.sendMessage({
        chatId: data.chatId,
        message: errMessage,
        options: {
          replyToMessageId: data.messageId,
        },
      })
      return;
    }

    await this.prismaService.transaction(async () => {
      const message = await this.storeMessage(data);
      const approvalMessage = `[${message.id}] Data train (need to be approved) by ${message.sender.username ?? ''} (${message.sender.first_name ?? ''} ${message.sender.last_name ?? ''}): "${message.typeMessage}"`;
      await this.telegramBotService.sendMessage({
        chatId: this.approveChatId,
        message: approvalMessage,
      });
    }, [this.telegramMessageRepository]);
  }

  private async processApproveType(
    data: TelegramMessagePayload,
  ): Promise<void> {
    const message = await this.telegramMessageRepository.getById(Number(data.message));
    if (!message) {
      return;
    }

    await this.prismaService.transaction(async () => {
      await this.storeMessage({
        type: TelegramMessageType.APPROVE,
        messageId: data.messageId,
        chatId: data.chatId,
        originalMessage: data.originalMessage,
        message: data.message,
        sender: data.sender,
      })

      await this.trainDataRepository.create({
        data: message.typeMessage,
        telegramBotMessageId: message.id,
        status: TrainDataStatus.PENDING,
        createdAt: new Date(), 
      });

      const approvedMessage = 'Your train data has been approved';
      await this.telegramBotService.sendMessage({
        chatId: message.chatId,
        message: approvedMessage,
        options: {
          replyToMessageId: message.messageId,
        },
      });
    }, [this.trainDataRepository, this.telegramMessageRepository]);
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