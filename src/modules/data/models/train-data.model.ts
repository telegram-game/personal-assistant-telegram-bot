import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class GetsForTrainPayload {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  aiModelId: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit: number = 10;
}

export class UpdateCompletedForTrainPayload {
  @IsNumber()
  aiModelId: number;

  @IsArray()
  trainDataIds: number[];
}

export class UpdateProcessingForTrainPayload {
  @IsNumber()
  aiModelId: number;
}
