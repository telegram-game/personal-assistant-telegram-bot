import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import { AIModels } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AIModelRepository } from '../repositories/ai-model.repository';
import { PrismaService } from 'src/modules/prisma';
import { PredictionService } from 'src/modules/shared/services/prediction-service.service';

@Injectable()
export class AIModelService {
  private readonly logger = new Logger(AIModelService.name);
  private readonly approveChatId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly aiModelRepository: AIModelRepository,
    private readonly prismaService: PrismaService,
    private readonly predictionService: PredictionService,
  ) {
    this.approveChatId = this.configService.get<string>('approveChatId');
   }

  public async getCurrent(): Promise<AIModels> {
    return await this.aiModelRepository.getCurrent();
  }

  public async complete(aiModelId: number, path: string): Promise<void> {
    await this.prismaService.transaction(async () => {
      await this.aiModelRepository.complete(aiModelId, path);
      await this.predictionService.loadNewModel(path);
    }, [this.aiModelRepository]);
  }
}