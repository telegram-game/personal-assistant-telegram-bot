import { Controller, Get } from '@nestjs/common';
import { AIModelService } from '../services/ai-model.service';
import { AIModels } from '@prisma/client';

@Controller({
  path: ['/internal/api/v1.0/models'],
  version: ['1.0'],
})
export class AIModelController {
  constructor(
    private readonly aiModelService: AIModelService,
  ) {}

  @Get('/current')
  async getCurrent(): Promise<AIModels> {
    return await this.aiModelService.getCurrent();
  }
}
