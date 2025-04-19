import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Local = 'local',
  Development = 'development',
  QA = 'qa',
  Staging = 'staging',
  Production = 'production',
}

export class EnvironmentTelegramBotVariables {
  @IsString()
  TZ: string;

  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  DATA_SERVICE_URL: string;

  @IsString()
  TELEGRAM_TOKEN: string;

  @IsString()
  APPROVE_CHAT_ID: string;

  validate(config: Record<string, unknown>, options: Record<string, unknown>) {
    if (options.appName !== process.env.APP_NAME) {
      return {};
    }

    const validatedConfig = plainToInstance(
      EnvironmentTelegramBotVariables,
      config,
      {
        enableImplicitConversion: true,
      },
    );
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const message = errors
        .flatMap(({ constraints }) =>
          Object.keys(constraints).flatMap((key) => constraints[key]),
        )
        .join('\n');
      console.error(`ENV Missing:\n${message}`);
      return {
        error: message,
      };
    }
    return { validatedConfig };
  }
}

export class EnvironmentDataVariables {
  @IsString()
  TZ: string;

  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  POSTGRESQL_USER: string;

  @IsString()
  POSTGRESQL_PASSWORD: string;

  @IsString()
  POSTGRESQL_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  POSTGRESQL_PORT: number;

  @IsString()
  POSTGRESQL_DB: string;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  TELEGRAM_BOT_SERVICE_URL: string;

  @IsString()
  DATA_SERVICE_URL: string;

  @IsString()
  PREDICTION_SERVICE_URL: string;

  @IsString()
  TRAIN_SERVICE_URL: string;

  validate(config: Record<string, unknown>, options: Record<string, unknown>) {
    if (options.appName !== process.env.APP_NAME) {
      return {};
    }

    const validatedConfig = plainToInstance(EnvironmentDataVariables, config, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const message = errors
        .flatMap(({ constraints }) =>
          Object.keys(constraints).flatMap((key) => constraints[key]),
        )
        .join('\n');
      console.error(`ENV Missing:\n${message}`);
      return {
        error: message,
      };
    }
    return { validatedConfig };
  }
}

export class EnvironmentDataConsumerVariables {
  @IsString()
  TZ: string;

  @IsEnum(Environment)
  ENVIRONMENT: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  DATA_SERVICE_URL: string;

  validate(config: Record<string, unknown>, options: Record<string, unknown>) {
    if (options.appName !== process.env.APP_NAME) {
      return {};
    }

    const validatedConfig = plainToInstance(
      EnvironmentDataConsumerVariables,
      config,
      {
        enableImplicitConversion: true,
      },
    );
    const errors = validateSync(validatedConfig, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const message = errors
        .flatMap(({ constraints }) =>
          Object.keys(constraints).flatMap((key) => constraints[key]),
        )
        .join('\n');
      console.error(`ENV Missing:\n${message}`);
      return {
        error: message,
      };
    }
    return { validatedConfig };
  }
}
