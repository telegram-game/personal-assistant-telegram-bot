import { Module } from '@nestjs/common';
import { HealthController } from './controllers';

@Module({
  imports: [],
  controllers: [HealthController],
  exports: [],
  providers: [],
})
export class HealthModule {}
