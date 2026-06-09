import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from './queues.module';
import { StatementImportProcessor } from './processors/statement-import.processor';
import { AnalyticsRefreshProcessor } from './processors/analytics-refresh.processor';
import { InsightsProcessor } from './processors/insights.processor';
import { NotificationsProcessor } from './processors/notifications.processor';
import { CategorizationModule } from '../modules/categorization/categorization.module';
import { StorageModule } from '../modules/storage/storage.module';
import { InsightsModule } from '../modules/insights/insights.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    CategorizationModule,
    StorageModule,
    forwardRef(() => InsightsModule),
    NotificationsModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.STATEMENT_IMPORT },
      { name: QUEUE_NAMES.ANALYTICS_REFRESH },
      { name: QUEUE_NAMES.INSIGHTS },
      { name: QUEUE_NAMES.NOTIFICATIONS },
    ),
  ],
  providers: [
    StatementImportProcessor,
    AnalyticsRefreshProcessor,
    InsightsProcessor,
    NotificationsProcessor,
  ],
})
export class QueueProcessorsModule {}
