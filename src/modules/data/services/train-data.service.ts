import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import { AIModels, TraninData } from '@prisma/client';
import { TrainDataRepository } from '../repositories/train-data.repository';

@Injectable()
export class TrainDataService {
  private readonly logger = new Logger(TrainDataService.name);
  constructor(
    private readonly trainDataRepository: TrainDataRepository,
  ) {}

  public async getForTrain(
    aiModelId: number,
    limit: number = 10,
  ): Promise<TraninData[]> {
    return await this.trainDataRepository.getForTrain(aiModelId, limit);
  }

  public async updateProcessingForTrain(
    aiModelId: number,
  ): Promise<void> {
    await this.trainDataRepository.updateProcessingForTrain(aiModelId);
  }

  public async updateCompletedForTrain(
    aiModelId: number,
    trainDataIds: number[],
  ): Promise<void> {
    await this.trainDataRepository.updateCompletedForTrain(aiModelId, trainDataIds);
  }
}