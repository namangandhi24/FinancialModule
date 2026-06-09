import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NetWorthService } from '../net-worth/net-worth.service';
import { GenerateForecastInput } from '@finpilot/shared';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ForecastsService {
  constructor(
    private prisma: PrismaService,
    private netWorthService: NetWorthService,
  ) {}

  async findAll(userId: string, horizon?: number) {
    return this.prisma.forecast.findMany({
      where: { userId, ...(horizon ? { horizon } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async generate(userId: string, input: GenerateForecastInput) {
    const current = await this.netWorthService.getCurrent(userId);
    const cashFlow = await this.netWorthService.getCashFlow(userId);

    const monthlySavings =
      input.monthlySavingsRate ??
      Math.max(0, cashFlow.netCashFlow);

    const growthRate = input.annualGrowthRate;
    const monthlyGrowth = Math.pow(1 + growthRate, 1 / 12) - 1;
    const startNetWorth = current.netWorth;
    const projections: { year: number; netWorth: number; savings: number }[] = [];

    let netWorth = startNetWorth;
    for (let year = 1; year <= input.horizon; year++) {
      for (let month = 0; month < 12; month++) {
        netWorth = netWorth * (1 + monthlyGrowth) + monthlySavings;
      }
      projections.push({
        year,
        netWorth: Math.round(netWorth * 100) / 100,
        savings: Math.round(monthlySavings * 12 * 100) / 100,
      });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentTx = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo },
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      },
      select: { amount: true, type: true },
    });

    let income = 0;
    let expenses = 0;
    for (const tx of recentTx) {
      const amt = tx.amount.toNumber();
      if (tx.type === TransactionType.INCOME) income += amt;
      else expenses += amt;
    }

    const data = {
      startNetWorth,
      monthlySavings,
      annualGrowthRate: growthRate,
      projections,
      assumptions: {
        avgMonthlyIncome: income / 3,
        avgMonthlyExpenses: expenses / 3,
        currency: 'mixed',
      },
      generatedAt: new Date().toISOString(),
    };

    return this.prisma.forecast.create({
      data: {
        userId,
        horizon: input.horizon,
        data,
      },
    });
  }
}
