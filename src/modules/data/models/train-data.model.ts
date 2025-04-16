import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetsForTrainPayload {
  @Transform(({ value }) => Number(value))
  aiModelId: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit: number = 10;
};

export class UpdateCompletedForTrainPayload {
  @IsNumber()
  aiModelId: number;

  @IsArray({ each: true })
  trainDataIds: number[];
}

export class UpdateProcessingForTrainPayload {
  @IsNumber()
  aiModelId: number;
}