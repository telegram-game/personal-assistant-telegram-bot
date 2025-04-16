import { Injectable, Scope } from '@nestjs/common';
import { TrainDataStatus, TraninData } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma';
import { BaseRepository } from 'src/modules/prisma/base/base.repository';

export type CreationTrainDataMessage = Omit<TraninData, 'id' | 'updatedAt'>;

@Injectable({
  scope: Scope.REQUEST,
})
export class TrainDataRepository extends BaseRepository {
  constructor(prismaService: PrismaService) {
    super(prismaService);
  }

  public async create(message: CreationTrainDataMessage): Promise<TraninData> {
    return this.client.traninData.create({
      data: message,
    });
  }

  public async getForTrain(
    aiModelId: number,
    limit: number = 10,
  ): Promise<TraninData[]> {
    return await this.client.traninData.findMany({
      where: {
        aiModelId,
        status: TrainDataStatus.PROCESSING,
      },
      take: limit,
    });
  }

  public async updateProcessingForTrain(
    aiModelId: number,
  ): Promise<void> {
    await this.client.traninData.updateMany({
      where: {
        aiModelId,
        status: TrainDataStatus.DONE,
      },
      data: {
        status: TrainDataStatus.PROCESSING,
      },
    });
  }

  public async updateCompletedForTrain(
    aiModelId: number,
    trainDataIds: number[],
  ): Promise<void> {
    await this.client.traninData.updateMany({
      where: {
        id: {
          in: trainDataIds,
        },
        aiModelId,
        status: TrainDataStatus.PROCESSING,
      },
      data: {
        status: TrainDataStatus.DONE,
      },
    });
  }

  public async updateForTraining(
    aiModelId: number,
  ): Promise<number> {
    const data = await this.client.traninData.updateMany({
      where: {
        status: TrainDataStatus.PENDING,
      },
      data: {
        aiModelId,
        status: TrainDataStatus.PROCESSING,
      },
    });
    return data.count
  }
}
