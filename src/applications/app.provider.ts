import { Injectable } from '@nestjs/common';
import {
  DataAppModule,
  DataConsumerAppModule,
  TelegramBotAppModule,
} from './app.module';

export type AppName =
  | 'TELEGRAM_BOT_SERVICE'
  | 'DATA_SERVICE'
  | 'DATA_CONSUMER';

@Injectable()
export class AppProvider {
  public getAppModule() {
    const appName: AppName = (process.env.APP_NAME || 'TELEGRAM_BOT_SERVICE') as AppName;
    return (
      {
        TELEGRAM_BOT_SERVICE: TelegramBotAppModule,
        DATA_SERVICE: DataAppModule,
        DATA_CONSUMER: DataConsumerAppModule,
      }[appName] || TelegramBotAppModule
    );
  }
  public getAppName(): AppName {
    return (process.env.APP_NAME || 'TELEGRAM_BOT_SERVICE') as AppName;
  }
}

export const appProvider = new AppProvider();
