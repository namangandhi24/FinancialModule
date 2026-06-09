import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NetWorthService } from '../net-worth/net-worth.service';
import { BudgetsService } from '../budgets/budgets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QUEUE_NAMES } from '../../queues/queues.module';
import { TransactionType } from '@prisma/client';

@Injectable()
export class InsightsService {
  constructor(
    private prisma: PrismaService,
    private netWorthService: NetWorthService,
    private budgetsService: BudgetsService,
    private notificationsService: NotificationsService,
    @InjectQueue(QUEUE_NAMES.INSIGHTS) private insightsQueue: Queue,
  ) {}

  async findAll(userId: string, limit = 20, type?: string) {
    return this.prisma.insight.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async enqueueGeneration(userId: string) {
    await this.insightsQueue.add('generate-insights', { userId });
    return { message: 'Insight generation queued' };
  }

  async generateInsights(userId: string) {
    const insights: { title: string; message: string; type: string; metadata?: object }[] = [];
    const now = new Date();

    const performance = await this.budgetsService.getPerformance(
      userId,
      now.getMonth() + 1,
      now.getFullYear(),
    );

    for (const item of performance.items) {
      if (item.isOverBudget) {
        insights.push({
          type: 'budget_warning',
          title: `Over budget: ${item.category?.name}`,
          message: `You've spent ${item.percentUsed.toFixed(0)}% of your ${item.category?.name} budget this month (${item.actual.toFixed(0)} of ${item.budgetAmount.toFixed(0)}).`,
          metadata: { categoryId: item.categoryId, percentUsed: item.percentUsed },
        });
      } else if (item.percentUsed >= 80) {
        insights.push({
          type: 'budget_warning',
          title: `Approaching limit: ${item.category?.name}`,
          message: `You're at ${item.percentUsed.toFixed(0)}% of your ${item.category?.name} budget with time left this month.`,
          metadata: { categoryId: item.categoryId, percentUsed: item.percentUsed },
        });
      }
    }

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthSpending = await this.netWorthService.getSpendingByCategory(
      userId,
      lastMonth,
      lastMonthEnd,
      10,
    );
    const thisMonthSpending = await this.netWorthService.getSpendingByCategory(
      userId,
      thisMonthStart,
      now,
      10,
    );

    const lastMap = new Map(lastMonthSpending.categories.map((c) => [c.categoryId, c.total]));
    for (const cat of thisMonthSpending.categories) {
      const prev = lastMap.get(cat.categoryId) || 0;
      if (prev > 0 && cat.total > prev * 1.5) {
        insights.push({
          type: 'spending_anomaly',
          title: `Spending spike: ${cat.name}`,
          message: `${cat.name} spending is ${((cat.total / prev - 1) * 100).toFixed(0)}% higher than last month.`,
          metadata: { categoryId: cat.categoryId, current: cat.total, previous: prev },
        });
      }
    }

    const cashFlow = await this.netWorthService.getCashFlow(userId);
    if (cashFlow.netCashFlow < 0) {
      insights.push({
        type: 'cash_flow',
        title: 'Negative cash flow this month',
        message: `Expenses (${cashFlow.expenses.toFixed(0)}) exceed income (${cashFlow.income.toFixed(0)}) by ${Math.abs(cashFlow.netCashFlow).toFixed(0)}.`,
        metadata: { income: cashFlow.income, expenses: cashFlow.expenses },
      });
    } else if (cashFlow.netCashFlow > 0) {
      insights.push({
        type: 'savings',
        title: 'Positive savings rate',
        message: `You're saving ${cashFlow.netCashFlow.toFixed(0)} this month — great progress toward your goals.`,
        metadata: { netCashFlow: cashFlow.netCashFlow },
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const largeTx = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
        type: TransactionType.EXPENSE,
      },
      orderBy: { amount: 'desc' },
      take: 3,
      include: { category: { select: { name: true } } },
    });

    const avgExpense = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: thirtyDaysAgo },
      },
      _avg: { amount: true },
    });

    const avg = avgExpense._avg.amount?.toNumber() || 0;
    for (const tx of largeTx) {
      const amt = tx.amount.toNumber();
      if (avg > 0 && amt > avg * 3) {
        insights.push({
          type: 'anomaly',
          title: 'Unusually large expense',
          message: `${tx.merchantName || 'A transaction'} for ${amt.toFixed(0)} (${tx.category?.name || 'Uncategorized'}) is significantly above your average expense.`,
          metadata: { transactionId: tx.id, amount: amt },
        });
      }
    }

    const created = [];
    for (const insight of insights.slice(0, 10)) {
      const record = await this.prisma.insight.create({
        data: {
          userId,
          title: insight.title,
          message: insight.message,
          type: insight.type,
          metadata: insight.metadata,
        },
      });
      created.push(record);

      if (insight.type === 'budget_warning') {
        await this.notificationsService.create(userId, {
          title: insight.title,
          message: insight.message,
          channel: 'IN_APP',
          metadata: insight.metadata,
        });
      }
    }

    return { generated: created.length, insights: created };
  }
}
