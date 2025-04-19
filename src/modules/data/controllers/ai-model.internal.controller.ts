import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AIModelService } from '../services/ai-model.service';
import { AIModels } from '@prisma/client';
import { UpdateCompletePayload } from '../models/ai-model.model';

@Controller({
  path: ['/internal/api/v1.0/models'],
  version: ['1.0'],
})
export class AIModelController {
  constructor(private readonly aiModelService: AIModelService) {}

  @Get('/current')
  async getCurrent(): Promise<AIModels> {
    return await this.aiModelService.getCurrent();
  }

  @Post('/complete')
  @HttpCode(HttpStatus.ACCEPTED)
  async complete(@Body() data: UpdateCompletePayload): Promise<void> {
    const { aiModelId, path } = data;
    await this.aiModelService.complete(aiModelId, path);
  }
}
