import { Injectable } from '@nestjs/common';
import { Logger } from 'src/modules/loggers/logger.service';
import { AIModels } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AIModelRepository } from '../repositories/ai-model.repository';

@Injectable()
export class AIModelService {
  private readonly logger = new Logger(AIModelService.name);
  private readonly approveChatId: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly aiModelRepository: AIModelRepository,
  ) {
    this.approveChatId = this.configService.get<string>('approveChatId');
   }

  public async getCurrent(): Promise<AIModels> {
    return await this.aiModelRepository.getCurrent();
  }
}