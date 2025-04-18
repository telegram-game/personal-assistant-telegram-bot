import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClientService } from "src/modules/http";

@Injectable()
export class PredictionService {
    private predictionServiceUrl: string;
    constructor(
        private readonly configService: ConfigService,
        private readonly internalHttpClientService: InternalHttpClientService,
    ) {
        this.predictionServiceUrl = this.configService.get<string>('predictionServiceUrl');
    }

    predictText(prompt: string): Promise<void> {
        return this.internalHttpClientService.post(`${this.predictionServiceUrl}/internal/api/v1.0/predictions/text`, {
            prompt,
        });
    }

    loadNewModel(path: string): Promise<void> {
        return this.internalHttpClientService.post(`${this.predictionServiceUrl}/internal/api/v1.0/predictions/text/load`, {
            path,
        });
    }
}