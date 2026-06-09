import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../../queues/queues.module';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.STATEMENT_IMPORT) private importQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYTICS_REFRESH) private analyticsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.INSIGHTS) private insightsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private notificationsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CATEGORIZATION) private categorizationQueue: Queue,
  ) {}

  async getStats() {
    const [users, accounts, transactions, imports, insights, notifications] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.account.count(),
        this.prisma.transaction.count(),
        this.prisma.statementImport.count(),
        this.prisma.insight.count(),
        this.prisma.notification.count(),
      ]);

    return {
      users,
      accounts,
      transactions,
      imports,
      insights,
      notifications,
      timestamp: new Date().toISOString(),
    };
  }

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          defaultCurrency: true,
          totpEnabled: true,
          createdAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getQueueStats() {
    const queues = [
      { name: QUEUE_NAMES.STATEMENT_IMPORT, queue: this.importQueue },
      { name: QUEUE_NAMES.ANALYTICS_REFRESH, queue: this.analyticsQueue },
      { name: QUEUE_NAMES.INSIGHTS, queue: this.insightsQueue },
      { name: QUEUE_NAMES.NOTIFICATIONS, queue: this.notificationsQueue },
      { name: QUEUE_NAMES.CATEGORIZATION, queue: this.categorizationQueue },
    ];

    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );
        return { name, ...counts };
      }),
    );

    return { queues: stats, timestamp: new Date().toISOString() };
  }

  async getAuditLogs(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }
}
