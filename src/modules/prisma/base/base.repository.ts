import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../services';

export abstract class BaseRepository {
  protected client: PrismaClient;
  constructor(private readonly origialPrismaService: PrismaService) {
    this.client = origialPrismaService;
  }

  joinTransaction(prismaClient: PrismaClient) {
    this.client = prismaClient;
  }

  leftTransaction() {
    this.client = this.origialPrismaService;
  }
}
