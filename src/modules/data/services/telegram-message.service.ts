import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import {
  TelegramMessageAskResultPayload,
  TelegramMessagePayload,
} from '../models/telegram-message.model';
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
import { PredictMessageProducer } from 'src/modules/queue/producer/predict-message-producer';
import { TrainService } from 'src/modules/shared/services/train-service.service';

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
    private readonly predictMessageProducer: PredictMessageProducer,
    private readonly telegramBotService: TelegramBotService,
    private readonly trainService: TrainService,
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
    });
  }

  public async receiveTelegramMessageInternalProcess(
    data: TelegramMessagePayload,
  ): Promise<void> {
    switch (data.type) {
      case TelegramMessageType.ASK:
        await this.processAskType(data);
        break;
      case TelegramMessageType.TRAIN:
        await this.processTrainType(data);
        break;
      case TelegramMessageType.APPROVE:
        await this.processApproveType(data);
        break;
      case TelegramMessageType.START_TRAIN:
        await this.processStartTrainType(data);
        break;
      default:
        break;
    }
  }

  public async askResult(data: TelegramMessageAskResultPayload): Promise<void> {
    const message = await this.telegramMessageRepository.getById(data.id);
    if (!message) {
      return;
    }

    await this.prismaService.transaction(async () => {
      await this.telegramMessageRepository.update(message.id, {
        replyAt: new Date(),
      });

      await this.telegramBotService.sendMessage({
        chatId: message.chatId,
        message: data.result,
        options: {
          replyToMessageId: message.messageId,
        },
      });
    }, [this.telegramMessageRepository]);
  }

  private async processAskType(data: TelegramMessagePayload): Promise<void> {
    await this.prismaService.transaction(async () => {
      const message = await this.storeMessage(data);
      await this.predictMessageProducer.sendMessage({
        id: message.id,
        prompt: message.typeMessage,
        maxTokens: 100,
        cid: data.cid,
      });
      const askMessage = `Processing your question: "${message.typeMessage}"`;
      await this.telegramBotService.sendMessage({
        chatId: message.chatId,
        message: askMessage,
        options: {
          replyToMessageId: message.messageId,
        },
      });
    }, [this.telegramMessageRepository]);
  }

  private async processTrainType(data: TelegramMessagePayload): Promise<void> {
    const existedData =
      await this.telegramMessageRepository.checkTrainDuplicate(data.message);
    if (existedData) {
      const errMessage = `Duplicate train data by ${existedData.sender.username ?? ''} (${existedData.sender.first_name ?? ''} ${existedData.sender.last_name ?? ''}) at ${existedData.createdAt}`;
      await this.telegramBotService.sendMessage({
        chatId: data.chatId,
        message: errMessage,
        options: {
          replyToMessageId: data.messageId,
        },
      });
      return;
    }

    const errStr = await this.trainService.validateTrainData(data.message);
    if (errStr) {
      const errMessage = `Invalid train data: ${errStr}`;
      await this.telegramBotService.sendMessage({
        chatId: data.chatId,
        message: errMessage,
        options: {
          replyToMessageId: data.messageId,
        },
      });
      return;
    }

    await this.prismaService.transaction(async () => {
      const message = await this.storeMessage(data);
      const approvalMessage = `[${message.id}] Data train (need to be approved) by ${message.sender.username ?? ''} (${message.sender.first_name ?? ''} ${message.sender.last_name ?? ''}): "${this.formatAprroveMessage(message.typeMessage)}"`;
      await this.telegramBotService.sendMessage({
        chatId: this.approveChatId,
        message: approvalMessage,
      });
    }, [this.telegramMessageRepository]);
  }

  private async processApproveType(
    data: TelegramMessagePayload,
  ): Promise<void> {
    const message = await this.telegramMessageRepository.getById(
      Number(data.message),
    );
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
      });

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
      });
      return;
    }

    await this.prismaService
      .transaction(async () => {
        const now = new Date();

        const message = await this.storeMessage({
          type: TelegramMessageType.START_TRAIN,
          messageId: data.messageId,
          chatId: data.chatId,
          originalMessage: data.originalMessage,
          message: data.message,
          sender: data.sender,
        });

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

        const dataCount = await this.trainDataRepository.updateForTraining(
          aiTranin.id,
        );

        if (dataCount === 0) {
          const errMessage = 'There is no train data to start';
          await this.telegramBotService.sendMessage({
            chatId: data.chatId,
            message: errMessage,
            options: {
              replyToMessageId: data.messageId,
            },
          });
          throw new BusinessException({
            errorCode: ERROR_CODES.NO_TRAIN_DATA,
            status: 400,
          });
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
      }, [
        this.telegramMessageRepository,
        this.trainDataRepository,
        this.aiModelRepository,
      ])
      .catch((err: Error) => {
        if (
          err instanceof BusinessException &&
          err.errorCode === ERROR_CODES.NO_TRAIN_DATA
        ) {
          return;
        }

        this.logger.error(err.message);
        throw err;
      });
  }

  private async storeMessage(
    data: TelegramMessagePayload,
  ): Promise<TelegramBotMessages> {
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

  private formatAprroveMessage(message: string): string {
    if (message.length > 100) {
      return message.substring(0, 100) + '...';
    }
    return message;
  }
}
