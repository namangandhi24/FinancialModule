import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetInput, UpdateBudgetInput, BudgetQuery } from '@finpilot/shared';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: BudgetQuery) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    return this.prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
      orderBy: { amount: 'desc' },
    });
  }

  async create(userId: string, input: CreateBudgetInput) {
    try {
      return await this.prisma.budget.create({
        data: {
          userId,
          categoryId: input.categoryId,
          amount: new Decimal(input.amount),
          month: input.month,
          year: input.year,
          currency: input.currency,
        },
        include: {
          category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        },
      });
    } catch {
      throw new ConflictException('Budget already exists for this category and month');
    }
  }

  async update(userId: string, id: string, input: UpdateBudgetInput) {
    await this.findOne(userId, id);
    return this.prisma.budget.update({
      where: { id },
      data: {
        ...input,
        ...(input.amount !== undefined && { amount: new Decimal(input.amount) }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    });
  }

  async remove(userId: string, id: string) {
    const budget = await this.findOne(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    return budget;
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async getPerformance(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const budgets = await this.prisma.budget.findMany({
      where: { userId, month: m, year: y },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
      select: { categoryId: true, amount: true },
    });

    const spentByCategory = new Map<string, number>();
    for (const tx of transactions) {
      const key = tx.categoryId || 'uncategorized';
      spentByCategory.set(key, (spentByCategory.get(key) || 0) + tx.amount.toNumber());
    }

    const items = budgets.map((b) => {
      const budgetAmount = b.amount.toNumber();
      const actual = spentByCategory.get(b.categoryId) || 0;
      const remaining = budgetAmount - actual;
      const percentUsed = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;

      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        category: b.category,
        budgetAmount,
        actual,
        remaining,
        percentUsed,
        isOverBudget: actual > budgetAmount,
        currency: b.currency,
      };
    });

    const totalBudget = items.reduce((s, i) => s + i.budgetAmount, 0);
    const totalSpent = items.reduce((s, i) => s + i.actual, 0);

    return {
      month: m,
      year: y,
      items,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overBudgetCount: items.filter((i) => i.isOverBudget).length,
    };
  }
}
