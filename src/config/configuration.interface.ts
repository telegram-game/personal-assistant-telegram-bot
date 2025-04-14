import { LogLevel as NestLogLevel } from '@nestjs/common';
import { Environment } from './validation';

export type LogLevel = NestLogLevel | 'info';

export interface Configuration {
  appName: string;
  tz: string;
  port: number;
  env: Environment;
  logLevel: LogLevel;
  postGresUser: string;
  postGresPassword: string;
  postGresHost: string;
  postGresPort: number;
  postGresDb: string;
  redisHost: string;
  redisPort: number;
  redisMode: string;
  redisClusterNodes: string[];
  httpRequestTimeout: number;

  // For telegram bot service
  dataServiceUrl: string;
  telegramToken: string;
  adminUsernames: string[];
  approveChatId: string;

  // For data service
  telegramBotServiceUrl: string;
  predictionServiceUrl: string;
}
