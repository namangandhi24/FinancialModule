import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { CryptoModule } from './common/crypto/crypto.module';
import { OriginGuard } from './common/guards/origin.guard';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CategorizationModule } from './modules/categorization/categorization.module';
import { ImportsModule } from './modules/imports/imports.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { GoalsModule } from './modules/goals/goals.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { NetWorthModule } from './modules/net-worth/net-worth.module';
import { AuditModule } from './modules/audit/audit.module';
import { ForecastsModule } from './modules/forecasts/forecasts.module';
import { RetirementModule } from './modules/retirement/retirement.module';
import { AiModule } from './modules/ai/ai.module';
import { InsightsModule } from './modules/insights/insights.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { QueuesModule } from './queues/queues.module';
import { QueueProcessorsModule } from './queues/queue-processors.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CryptoModule,
    PrismaModule,
    EmailModule,
    StorageModule,
    QueuesModule,
    QueueProcessorsModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    CategorizationModule,
    ImportsModule,
    BudgetsModule,
    GoalsModule,
    InvestmentsModule,
    NetWorthModule,
    AuditModule,
    ForecastsModule,
    RetirementModule,
    AiModule,
    InsightsModule,
    NotificationsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
})
export class AppModule {}
