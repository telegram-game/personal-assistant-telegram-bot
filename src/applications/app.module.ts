import { Module } from '@nestjs/common';
import { CoreAppModule } from './core-app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Environment,
  EnvironmentDataConsumerVariables,
  EnvironmentDataVariables,
  EnvironmentTelegramBotVariables,
} from '../config/validation';
import configuration from '../config/configuration';
import { TelegramBotModule } from 'src/modules/telegram-bot/telegram-bot.module';
import { DataConsumerModule, DataModule } from 'src/modules/data/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: new EnvironmentTelegramBotVariables(),
      validationOptions: {
        abortEarly: true,
        appName: 'TELEGRAM_BOT_SERVICE',
      },
    }),
    CoreAppModule.forRootAsync({
      useFactory: (configSerivce: ConfigService) => ({
        env: configSerivce.get<Environment>('env'),
      }),
      inject: [ConfigService],
    }),
    TelegramBotModule,
  ],
})
export class TelegramBotAppModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: new EnvironmentDataVariables(),
      validationOptions: {
        abortEarly: true,
        appName: 'DATA_SERVICE',
      },
    }),
    CoreAppModule.forRootAsync({
      useFactory: (configSerivce: ConfigService) => ({
        env: configSerivce.get<Environment>('env'),
      }),
      inject: [ConfigService],
    }),
    DataModule,
  ],
})
export class DataAppModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: new EnvironmentDataConsumerVariables(),
      validationOptions: {
        abortEarly: true,
        appName: 'DATA_CONSUMER',
      },
    }),
    CoreAppModule.forRootAsync({
      useFactory: (configSerivce: ConfigService) => ({
        env: configSerivce.get<Environment>('env'),
      }),
      inject: [ConfigService],
    }),
    DataConsumerModule,
  ],
})
export class DataConsumerAppModule {}
