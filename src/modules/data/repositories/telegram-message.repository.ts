import { Injectable, Scope } from '@nestjs/common';
import { TelegramBotMessages } from '@prisma/client';
import { TelegramMessageType } from 'src/models/telegram-mesage.model';
import { PrismaService } from 'src/modules/prisma';
import { BaseRepository } from 'src/modules/prisma/base/base.repository';

export type CreationTelegramBotMessage = Omit<TelegramBotMessages, 'id' | 'replyAt'>;
export type UpdationTelegramBotMessage = Omit<TelegramBotMessages, 'id' | 'createdAt'>;

@Injectable({
  scope: Scope.REQUEST,
})
export class TelegramMessageRepository extends BaseRepository {
  constructor(prismaService: PrismaService) {
    super(prismaService);
  }

  public async create(message: CreationTelegramBotMessage): Promise<TelegramBotMessages> {
    return this.client.telegramBotMessages.create({
      data: message,
    });
  }

  public async update(id: number, data: Partial<UpdationTelegramBotMessage>): Promise<TelegramBotMessages> {
    return this.client.telegramBotMessages.update({
      where: {
        id,
      },
      data,
    });
  }

  public async checkTrainDuplicate(message: string): Promise<TelegramBotMessages> {
    const train = await this.client.telegramBotMessages.findFirst({
      where: {
        type: TelegramMessageType.TRAIN,
        typeMessage: message,
      },
    });

    return train;
  }

  public async getById(id: number): Promise<TelegramBotMessages> {
    return this.client.telegramBotMessages.findUnique({
      where: {
        id,
      },
    });
  }
}
