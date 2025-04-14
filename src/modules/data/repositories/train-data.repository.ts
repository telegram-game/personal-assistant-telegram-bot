import { Injectable, Scope } from '@nestjs/common';
import { TraninData } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma';
import { BaseRepository } from 'src/modules/prisma/base/base.repository';

export type CreationTrainDataMessage = Omit<TraninData, 'id' | 'updatedAt'>;

@Injectable({
  scope: Scope.REQUEST,
})
export class TrainDataRepository extends BaseRepository {
  constructor(prismaService: PrismaService) {
    super(prismaService);
  }

  public async create(message: CreationTrainDataMessage): Promise<TraninData> {
    return this.client.traninData.create({
      data: message,
    });
  }
}
