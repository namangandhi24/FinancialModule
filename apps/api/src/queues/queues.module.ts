import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const QUEUE_NAMES = {
  STATEMENT_IMPORT: 'statement-import',
  CATEGORIZATION: 'categorization',
  ANALYTICS_REFRESH: 'analytics-refresh',
  INSIGHTS: 'insights',
  NOTIFICATIONS: 'notifications',
} as const;

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.STATEMENT_IMPORT },
      { name: QUEUE_NAMES.CATEGORIZATION },
      { name: QUEUE_NAMES.ANALYTICS_REFRESH },
      { name: QUEUE_NAMES.INSIGHTS },
      { name: QUEUE_NAMES.NOTIFICATIONS },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
