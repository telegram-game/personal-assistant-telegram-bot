import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cluster, Redis, ScanStream } from 'ioredis';
import { Log, Logger } from 'src/modules/loggers';

export const RedisClientInjectable = Symbol('redisClient');
let redisClient: Redis | Cluster = null;
export const CreateClient = (options: any): Redis | Cluster => {
  if (redisClient) {
    return redisClient;
  }

  if (options.redisMode === 'client') {
    redisClient = new Redis(
      `redis://${options.redisHost}:${options.redisPort}`,
      {
        reconnectOnError(err) {
          const targetError = 'MOVED';
          if (err.message.includes(targetError)) {
            // Only reconnect reconnect and resend the failed command after reconnection. when the error contains "MOVED"
            return 2;
          }
        },
      },
    );
  } else if (options.redisMode === 'cluster') {
    const clusterNodes = options.redisClusterNodes;
    redisClient = new Cluster(
      clusterNodes.map((node: string) => ({ url: node })),
      {
        redisOptions: {
          reconnectOnError(err) {
            const targetError = 'MOVED';
            if (err.message.includes(targetError)) {
              // Only reconnect and resend the failed command. when the error contains "MOVED"
              return 2;
            }
          },
        },
      },
    );
  }

  return redisClient;
};

@Injectable()
export class CachingService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis | Cluster;
  private readonly logger = new Logger(CachingService.name);

  constructor(
    @Inject(RedisClientInjectable)
    redisClient: Redis | Cluster,
  ) {
    this.client = redisClient;
  }

  @Log()
  async onModuleInit() {
    if (this.client.status === 'close') {
      this.client.connect();
    }
  }

  @Log()
  async onModuleDestroy() {
    if (this.client.status === 'connect') {
      this.client.quit();
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error('getting from Redis error:', error);
      return [];
    }
  }

  createKeyScanner(pattern?: string, countPerCall: number = 100): ScanStream {
    try {
      if (this.client instanceof Redis) {
        return this.client.scanStream({
          match: pattern,
          count: countPerCall,
        });
      }
      throw new Error('cannot create scanner for cluster mode');
    } catch (error) {
      this.logger.error('creating key scanner from Redis error:', error);
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('getting from Redis error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      let args: any[] = [key, JSON.stringify(value)];
      if (ttl) {
        args = [...args, 'EX', ttl];
      }
      await this.client.set.call(this.client, ...args);
    } catch (error) {
      this.logger.error('setting in Redis error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error('deleting in Redis error:', error);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    try {
      let pipeline = this.client.pipeline();
      for (const key of keys) {
        pipeline = pipeline.del(key);
      }
      await pipeline.exec();
    } catch (error) {
      this.logger.error('deleting in Redis error:', error);
    }
  }

  async hget<T>(key: string, hkey: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, hkey);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('getting hget from Redis error:', error);
      return null;
    }
  }

  async hexists(key: string, hkey: string): Promise<boolean> {
    try {
      const result = await this.client.hexists(key, hkey);
      return result == 1;
    } catch (error) {
      this.logger.error('check exist hkey from Redis error:', error);
      return null;
    }
  }

  async hset<T>(key: string, hkey: string, value: T): Promise<void> {
    try {
      await this.client.hset(key, hkey, JSON.stringify(value));
    } catch (error) {
      this.logger.error('setting hset in Redis error:', error);
    }
  }

  async hdel(key: string, hkey: string): Promise<void> {
    try {
      await this.client.hdel(key, hkey);
    } catch (error) {
      this.logger.error('deleting hdel in Redis error:', error);
    }
  }

  async hgetAll(key: string): Promise<Record<string, string> | null> {
    try {
      const value = await this.client.hgetall(key);
      if (!value) return null;

      return value;
    } catch (error) {
      this.logger.error('getting hgetAll from Redis error:', error);
      return null;
    }
  }

  // Add other methods for Redis operations (e.g., del, hget, hset, etc.)
}
