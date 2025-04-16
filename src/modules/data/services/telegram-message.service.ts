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
import { AIModelRepository } from '../repositories/ai-model.repository';
import dayjs from 'dayjs';
import { BusinessException } from 'src/exceptions';
import { ERROR_CODES } from 'src/constants/errors';
import { BuildModelProducer } from 'src/modules/queue/producer/build-model-producer';

@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private readonly approveChatId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly telegramMessageRepository: TelegramMessageRepository,
    private readonly trainDataRepository: TrainDataRepository,
    private readonly aiModelRepository: AIModelRepository,
    private readonly telegramMessageProducer: TelegramMessageProducer,
    private readonly buildModelProducer: BuildModelProducer,
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
      case TelegramMessageType.ASK:
        await this.processAskType(data);
      case TelegramMessageType.TRAIN:
        await this.processTrainType(data);
        break;
      case TelegramMessageType.APPROVE:
        await this.processApproveType(data);
        break
      case TelegramMessageType.START_TRAIN:
        await this.processStartTrainType(data);
        break;
      default:
        break;
    }
  }

  private async processAskType(
    data: TelegramMessagePayload,
  ): Promise<void> {
    // const preditedMessage = 
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
        aiModelId: null,
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

  private async processStartTrainType(
    data: TelegramMessagePayload,
  ): Promise<void> {
    const hasPending = await this.aiModelRepository.hasPending();
    if (hasPending) {
      const errMessage = 'There is a pending train data';
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
      const now = new Date();

      const message = await this.storeMessage({
        type: TelegramMessageType.START_TRAIN,
        messageId: data.messageId,
        chatId: data.chatId,
        originalMessage: data.originalMessage,
        message: data.message,
        sender: data.sender,
      })

      const getCurrentModel = await this.aiModelRepository.getCurrent();

      const aiTranin = await this.aiModelRepository.create({
        name: data.message || dayjs(now).format('YYYYMMDDHHmmss'),
        description: data.originalMessage,
        telegramBotMessageId: message.id,
        path: '',
        baseModelId: getCurrentModel?.id,
        status: TrainDataStatus.PROCESSING,
        createdAt: now,
      });

      const dataCount = await this.trainDataRepository.updateForTraining(aiTranin.id);

      if (dataCount === 0) {
        const errMessage = 'There is no train data to start';
        await this.telegramBotService.sendMessage({
          chatId: data.chatId,
          message: errMessage,
          options: {
            replyToMessageId: data.messageId,
          },
        })
        throw new BusinessException({
          errorCode: ERROR_CODES.NO_TRAIN_DATA,
          status: 400,
        })
      }

      await this.buildModelProducer.sendMessage({
        id: aiTranin.id,
        name: aiTranin.name,
        fromModelPath: getCurrentModel?.path,
        dataFilePath: `output/${aiTranin.id}_${dayjs(now).format('YYYYMMDDHHmmss')}.pth`,
        cid: data.cid,
      });

      const startTrainMessage = `Your train session has been started with the id: ${aiTranin.id}`;
      await this.telegramBotService.sendMessage({
        chatId: message.chatId,
        message: startTrainMessage,
        options: {
          replyToMessageId: message.messageId,
        },
      });
    }, [this.telegramMessageRepository, this.trainDataRepository, this.aiModelRepository])
    .catch((err: Error) => {
      if (err instanceof BusinessException && err.errorCode === ERROR_CODES.NO_TRAIN_DATA) {
        return;
      }

      this.logger.error(err.message);
      throw err;
    });
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