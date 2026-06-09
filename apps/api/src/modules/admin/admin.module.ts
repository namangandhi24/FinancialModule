import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { QUEUE_NAMES } from '../../queues/queues.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.STATEMENT_IMPORT },
      { name: QUEUE_NAMES.ANALYTICS_REFRESH },
      { name: QUEUE_NAMES.INSIGHTS },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.CATEGORIZATION },
    ),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
