import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NetWorthService } from '../net-worth/net-worth.service';
import { BudgetsService } from '../budgets/budgets.service';
import { GoalsService } from '../goals/goals.service';
import { InvestmentsService } from '../investments/investments.service';
import { TransactionType } from '@prisma/client';

export interface ToolResult {
  tool: string;
  data: unknown;
}

@Injectable()
export class AiToolsService {
  constructor(
    private prisma: PrismaService,
    private netWorthService: NetWorthService,
    private budgetsService: BudgetsService,
    private goalsService: GoalsService,
    private investmentsService: InvestmentsService,
  ) {}

  async runRelevantTools(userId: string, message: string): Promise<ToolResult[]> {
    const lower = message.toLowerCase();
    const results: ToolResult[] = [];

    const wantsAccounts = /account|balance|bank|wallet/.test(lower);
    const wantsTransactions = /transaction|spend|expense|purchase|merchant/.test(lower);
    const wantsNetWorth = /net worth|wealth|asset|liabilit/.test(lower);
    const wantsBudget = /budget|over budget|limit/.test(lower);
    const wantsGoals = /goal|saving|target/.test(lower);
    const wantsInvestments = /invest|portfolio|stock|fund|etf/.test(lower);

    const runAll =
      !wantsAccounts &&
      !wantsTransactions &&
      !wantsNetWorth &&
      !wantsBudget &&
      !wantsGoals &&
      !wantsInvestments;

    if (wantsAccounts || runAll) {
      results.push({ tool: 'GetAccounts', data: await this.getAccounts(userId) });
    }
    if (wantsTransactions || runAll) {
      results.push({ tool: 'GetTransactions', data: await this.getTransactions(userId) });
    }
    if (wantsNetWorth || runAll) {
      results.push({ tool: 'GetNetWorth', data: await this.netWorthService.getCurrent(userId) });
    }
    if (wantsBudget || runAll) {
      const now = new Date();
      results.push({
        tool: 'GetBudgetPerformance',
        data: await this.budgetsService.getPerformance(
          userId,
          now.getMonth() + 1,
          now.getFullYear(),
        ),
      });
    }
    if (wantsGoals || runAll) {
      results.push({ tool: 'GetGoals', data: await this.goalsService.findAll(userId) });
    }
    if (wantsInvestments || runAll) {
      results.push({
        tool: 'GetInvestments',
        data: {
          investments: await this.investmentsService.findAll(userId),
          summary: await this.investmentsService.getSummary(userId),
        },
      });
    }

    return results;
  }

  private async getAccounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        institution: true,
      },
    });
  }

  private async getTransactions(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      include: {
        category: { select: { name: true, slug: true } },
        account: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return transactions.map((tx) => ({
      date: tx.date.toISOString().split('T')[0],
      amount: tx.amount.toNumber(),
      type: tx.type,
      merchant: tx.merchantName,
      category: tx.category?.name,
      account: tx.account.name,
    }));
  }

  formatToolContext(results: ToolResult[]): string {
    return results
      .map((r) => `### ${r.tool}\n${JSON.stringify(r.data, null, 2)}`)
      .join('\n\n');
  }
}
