import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { isLiabilityAccount, AccountType } from '@finpilot/shared';
import { TransactionType } from '@prisma/client';

@Injectable()
export class NetWorthService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    let assetsTotal = 0;
    let liabilitiesTotal = 0;
    const breakdown: Record<string, { total: number; count: number; currency: string }> = {};

    for (const account of accounts) {
      const balance = account.balance.toNumber();
      const signed = isLiabilityAccount(account.type as AccountType)
        ? -Math.abs(balance)
        : balance;

      if (isLiabilityAccount(account.type as AccountType)) {
        liabilitiesTotal += Math.abs(balance);
      } else {
        assetsTotal += balance;
      }

      if (!breakdown[account.type]) {
        breakdown[account.type] = { total: 0, count: 0, currency: account.currency };
      }
      breakdown[account.type].total += signed;
      breakdown[account.type].count += 1;
    }

    return {
      assetsTotal,
      liabilitiesTotal,
      netWorth: assetsTotal - liabilitiesTotal,
      breakdown,
      accountCount: accounts.length,
    };
  }

  async getHistory(userId: string, from?: Date, to?: Date) {
    const start = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = to || new Date();

    const snapshots = await this.prisma.netWorthSnapshot.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    if (snapshots.length > 0) {
      return {
        history: snapshots.map((s) => ({
          date: s.date.toISOString().split('T')[0],
          netWorth: s.netWorth.toNumber(),
          assetsTotal: s.assetsTotal.toNumber(),
          liabilitiesTotal: s.liabilitiesTotal.toNumber(),
        })),
        from: start,
        to: end,
        source: 'snapshots' as const,
      };
    }

    const currentNetWorth = (await this.getCurrent(userId)).netWorth;
    const days: { date: string; netWorth: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;

    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + dayMs)) {
      days.push({
        date: d.toISOString().split('T')[0],
        netWorth: currentNetWorth,
      });
    }

    return {
      history: days,
      from: start,
      to: end,
      source: 'computed' as const,
    };
  }

  async getCashFlow(userId: string, from?: Date, to?: Date) {
    const now = new Date();
    const start = from || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to || now;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
      },
      select: { amount: true, type: true, date: true },
    });

    let income = 0;
    let expenses = 0;

    for (const tx of transactions) {
      const amt = tx.amount.toNumber();
      if (tx.type === TransactionType.INCOME) income += amt;
      else expenses += amt;
    }

    return {
      income,
      expenses,
      netCashFlow: income - expenses,
      from: start,
      to: end,
    };
  }

  async getSpendingByCategory(
    userId: string,
    from?: Date,
    to?: Date,
    limit = 5,
  ) {
    const now = new Date();
    const start = from || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = to || now;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        type: TransactionType.EXPENSE,
      },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    });

    const categoryMap = new Map<
      string,
      { name: string; slug: string; color: string | null; icon: string | null; total: number }
    >();

    for (const tx of transactions) {
      const key = tx.categoryId || 'uncategorized';
      const existing = categoryMap.get(key) || {
        name: tx.category?.name || 'Uncategorized',
        slug: tx.category?.slug || 'uncategorized',
        color: tx.category?.color || '#64748b',
        icon: tx.category?.icon || 'help-circle',
        total: 0,
      };
      existing.total += tx.amount.toNumber();
      categoryMap.set(key, existing);
    }

    const categories = Array.from(categoryMap.entries())
      .map(([id, data]) => ({ categoryId: id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    const totalSpending = categories.reduce((sum, c) => sum + c.total, 0);

    return {
      categories,
      totalSpending,
      from: start,
      to: end,
    };
  }
}
