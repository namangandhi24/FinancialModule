import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queues.module';
import { isLiabilityAccount, AccountType } from '@finpilot/shared';
import { Decimal } from '@prisma/client/runtime/library';

interface AnalyticsJobData {
  userId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.ANALYTICS_REFRESH)
export class AnalyticsRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsRefreshProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.INSIGHTS) private insightsQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<AnalyticsJobData>) {
    const { userId } = job.data;

    const accounts = await this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    let assetsTotal = 0;
    let liabilitiesTotal = 0;

    for (const account of accounts) {
      const balance = account.balance.toNumber();
      if (isLiabilityAccount(account.type as AccountType)) {
        liabilitiesTotal += Math.abs(balance);
      } else {
        assetsTotal += balance;
      }
    }

    const netWorth = assetsTotal - liabilitiesTotal;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.netWorthSnapshot.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      update: {
        assetsTotal: new Decimal(assetsTotal),
        liabilitiesTotal: new Decimal(liabilitiesTotal),
        netWorth: new Decimal(netWorth),
      },
      create: {
        userId,
        date: today,
        assetsTotal: new Decimal(assetsTotal),
        liabilitiesTotal: new Decimal(liabilitiesTotal),
        netWorth: new Decimal(netWorth),
      },
    });

    await this.insightsQueue.add('generate-insights', { userId });

    this.logger.log(`Net worth snapshot refreshed for user ${userId}`);
    return { netWorth };
  }
}
