import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  GetsForTrainPayload,
  UpdateCompletedForTrainPayload,
  UpdateProcessingForTrainPayload,
} from '../models/train-data.model';
import { TraninData } from '@prisma/client';
import { TrainDataService } from '../services/train-data.service';

@Controller({
  path: ['/internal/api/v1.0/train-data/'],
  version: ['1.0'],
})
export class TrainDataController {
  constructor(private readonly trainDataService: TrainDataService) {}

  @Get('/for-train')
  async getsForTrain(
    @Query() payload: GetsForTrainPayload,
  ): Promise<TraninData[]> {
    const { aiModelId, limit } = payload;
    return await this.trainDataService.getForTrain(aiModelId, limit);
  }

  @Post('/for-train')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateCompletedForTrain(
    @Body() data: UpdateCompletedForTrainPayload,
  ): Promise<void> {
    const { aiModelId, trainDataIds } = data;
    await this.trainDataService.updateCompletedForTrain(
      aiModelId,
      trainDataIds,
    );
  }

  @Post('processing/for-train')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateProcessingForTrain(
    @Body() data: UpdateProcessingForTrainPayload,
  ): Promise<void> {
    const { aiModelId } = data;
    await this.trainDataService.updateProcessingForTrain(aiModelId);
  }
}
