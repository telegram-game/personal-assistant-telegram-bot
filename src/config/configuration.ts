import { Configuration, LogLevel } from './configuration.interface';
import { Environment } from './validation';

const parseEnvInt = (value: string | undefined, fallback: number): number =>
  parseInt(value ?? fallback.toString());

export default (): Configuration => {
  if (
    process.env.POSTGRESQL_USER &&
    process.env.POSTGRESQL_PASSWORD &&
    process.env.POSTGRESQL_HOST &&
    process.env.POSTGRESQL_PORT &&
    process.env.POSTGRESQL_DB
  ) {
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(process.env.POSTGRESQL_USER)}:${encodeURIComponent(process.env.POSTGRESQL_PASSWORD)}@${process.env.POSTGRESQL_HOST}:${process.env.POSTGRESQL_PORT}/${process.env.POSTGRESQL_DB}`;
  }

  return {
    appName: process.env.APP_NAME,
    env: process.env.ENVIRONMENT as Environment,
    tz: process.env.TZ,
    port: parseEnvInt(process.env.PORT, 3000),
    logLevel: process.env.LOG_LEVEL as LogLevel,
    postGresUser: process.env.POSTGRESQL_USER,
    postGresPassword: process.env.POSTGRESQL_PASSWORD,
    postGresHost: process.env.POSTGRESQL_HOST,
    postGresPort: parseInt(process.env.POSTGRESQL_PORT),
    postGresDb: process.env.POSTGRESQL_DB,
    redisHost: process.env.REDIS_HOST,
    redisPort: parseInt(process.env.REDIS_PORT),
    redisMode: process.env.REDIS_MODE || 'client',
    redisClusterNodes: process.env.REDIS_CLUSTER_NODES
      ? process.env.REDIS_CLUSTER_NODES.split(',')
      : [],
    httpRequestTimeout: parseEnvInt(process.env.HTTP_REQUEST_TIMEOUT, 10000),

    dataServiceUrl: process.env.DATA_SERVICE_URL,
    telegramToken: process.env.TELEGRAM_TOKEN,
    adminUsernames: process.env.ADMIN_USERNAMES
      ? process.env.ADMIN_USERNAMES.split(',') : [],
    approveChatId: process.env.APPROVE_CHAT_ID,

    telegramBotServiceUrl: process.env.TELEGRAM_BOT_SERVICE_URL,
    predictionServiceUrl: process.env.PREDICTION_SERVICE_URL,
  };
};
