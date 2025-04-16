import { Injectable, Scope } from '@nestjs/common';
import { AIModels, TrainDataStatus, TraninData } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma';
import { BaseRepository } from 'src/modules/prisma/base/base.repository';

export type CreationAIModel = Omit<AIModels, 'id' | 'updatedAt'>;

@Injectable({
  scope: Scope.REQUEST,
})
export class AIModelRepository extends BaseRepository {
  constructor(prismaService: PrismaService) {
    super(prismaService);
  }

  public async create(message: CreationAIModel): Promise<AIModels> {
    return this.client.aIModels.create({
      data: message,
    });
  }
  
  public async getCurrent(): Promise<AIModels> {
    return this.client.aIModels.findFirst({
      where: {
        status: TrainDataStatus.DONE,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });
  }

  public async hasPending(): Promise<boolean> {
    return !this.client.aIModels.findFirst({
      where: {
        status: TrainDataStatus.PENDING,
      },
    })
  }

  public async complete(id: number, path: string): Promise<void> {
    await this.client.aIModels.update({
      where: {
        id,
      },
      data: {
        status: TrainDataStatus.DONE,
        path,
        updatedAt: new Date(),
      },
    });
  }
}
