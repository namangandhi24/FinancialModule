import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { NetWorthModule } from '../net-worth/net-worth.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QUEUE_NAMES } from '../../queues/queues.module';

@Module({
  imports: [
    NetWorthModule,
    BudgetsModule,
    forwardRef(() => NotificationsModule),
    BullModule.registerQueue({ name: QUEUE_NAMES.INSIGHTS }),
  ],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
