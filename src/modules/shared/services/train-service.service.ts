import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalHttpClientService } from 'src/modules/http';

@Injectable()
export class TrainService {
  private trainServiceUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly internalHttpClientService: InternalHttpClientService,
  ) {
    this.trainServiceUrl = this.configService.get<string>('trainServiceUrl');
  }

  async validateTrainData(txt: string): Promise<string | undefined> {
    return this.internalHttpClientService
      .post(
        `${this.trainServiceUrl}/internal/api/v1.0/trainings/text/validate`,
        {
          data: txt,
        },
      )
      .then(() => {
        return undefined;
      })
      .catch((err) => {
        return err.errorMessage;
      });
  }
}
