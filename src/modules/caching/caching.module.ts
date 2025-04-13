import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RedisClientInjectable,
  CreateClient,
  CachingService,
} from './services/caching.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisClientInjectable,
      useFactory: (configService: ConfigService) => {
        const options = {
          redisHost: configService.get<string>('redisHost'),
          redisPort: configService.get<number>('redisPort'),
          redisMode: configService.get<string>('redisMode'),
          redisClusterNodes: configService.get<string[]>('redisClusterNodes'),
        };
        return CreateClient(options);
      },
      inject: [ConfigService],
    },
    CachingService,
  ],
  exports: [CachingService],
})
export class CachingModule {}
