import { IsNumber, IsString } from 'class-validator';

export class UpdateCompletePayload {
  @IsNumber()
  aiModelId: number;

  @IsString()
  path: string;
}
