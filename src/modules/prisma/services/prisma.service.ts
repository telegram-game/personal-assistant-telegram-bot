import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Log } from 'src/modules/loggers';
import { BaseRepository } from '../base/base.repository';

export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  @Log()
  async onModuleInit() {
    await super.$connect();
  }

  @Log()
  async onModuleDestroy() {
    await super.$disconnect();
  }

  /**
   * @deprecated
   */
  $on(): void {
    throw new Error('Method $on is not available in PrismaService');
  }

  /**
   * @deprecated
   */
  async $disconnect(): Promise<void> {
    throw new Error('Method $disconnect is not available in PrismaService');
  }

  async transaction<R>(
    fn: (tx: PrismaClient) => Promise<R>,
    repositories?: BaseRepository[],
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<R> {
    repositories = repositories || [];
    return await super
      .$transaction(async (tx: PrismaClient) => {
        for (const repository of repositories) {
          repository.joinTransaction(tx);
        }
        return await fn(tx);
      }, options)
      .finally(() => {
        for (const repository of repositories) {
          repository.leftTransaction();
        }
      });
  }
}

let prismaService: PrismaService | null;

// This is because we run some services that not require database connection
if (process.env.DATABASE_URL) {
  prismaService = new PrismaService();
}

export default prismaService;
