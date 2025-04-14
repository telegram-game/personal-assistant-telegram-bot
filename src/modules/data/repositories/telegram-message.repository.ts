import { Injectable, Scope } from '@nestjs/common';
import { TelegramBotMessages } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma';
import { BaseRepository } from 'src/modules/prisma/base/base.repository';

export type CreationTelegramBotMessage = Omit<TelegramBotMessages, 'id' | 'replyAt'>;

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

  public async checkTrainDuplicate(message: string): Promise<TelegramBotMessages> {
    const train = await this.client.telegramBotMessages.findFirst({
      where: {
        type: 'TRAIN',
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
