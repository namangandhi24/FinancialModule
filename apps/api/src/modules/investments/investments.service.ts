import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateHoldingInput,
  UpdateHoldingInput,
} from '@finpilot/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { holdings: true },
      orderBy: { name: 'asc' },
    });

    return investments.map((inv) => this.enrichInvestment(inv));
  }

  async findOne(userId: string, id: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id, userId },
      include: { holdings: true },
    });
    if (!investment) throw new NotFoundException('Investment not found');
    return this.enrichInvestment(investment);
  }

  async create(userId: string, input: CreateInvestmentInput) {
    const investment = await this.prisma.investment.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        symbol: input.symbol,
        currency: input.currency,
      },
      include: { holdings: true },
    });
    return this.enrichInvestment(investment);
  }

  async update(userId: string, id: string, input: UpdateInvestmentInput) {
    await this.findOne(userId, id);
    const investment = await this.prisma.investment.update({
      where: { id },
      data: input,
      include: { holdings: true },
    });
    return this.enrichInvestment(investment);
  }

  async remove(userId: string, id: string) {
    const investment = await this.findOne(userId, id);
    await this.prisma.investment.delete({ where: { id } });
    return investment;
  }

  async addHolding(userId: string, investmentId: string, input: CreateHoldingInput) {
    await this.findOne(userId, investmentId);
    const holding = await this.prisma.holding.create({
      data: {
        investmentId,
        quantity: new Decimal(input.quantity),
        averageCost: new Decimal(input.averageCost),
        currentPrice: new Decimal(input.currentPrice ?? 0),
      },
    });
    return this.formatHolding(holding);
  }

  async updateHolding(
    userId: string,
    investmentId: string,
    holdingId: string,
    input: UpdateHoldingInput,
  ) {
    await this.findOne(userId, investmentId);
    const holding = await this.prisma.holding.findFirst({
      where: { id: holdingId, investmentId },
    });
    if (!holding) throw new NotFoundException('Holding not found');

    const updated = await this.prisma.holding.update({
      where: { id: holdingId },
      data: {
        ...(input.quantity !== undefined && { quantity: new Decimal(input.quantity) }),
        ...(input.averageCost !== undefined && { averageCost: new Decimal(input.averageCost) }),
        ...(input.currentPrice !== undefined && { currentPrice: new Decimal(input.currentPrice) }),
      },
    });
    return this.formatHolding(updated);
  }

  async removeHolding(userId: string, investmentId: string, holdingId: string) {
    await this.findOne(userId, investmentId);
    const holding = await this.prisma.holding.findFirst({
      where: { id: holdingId, investmentId },
    });
    if (!holding) throw new NotFoundException('Holding not found');
    await this.prisma.holding.delete({ where: { id: holdingId } });
    return this.formatHolding(holding);
  }

  async getAllocation(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { holdings: true },
    });

    const byType: Record<string, { type: string; value: number; count: number }> = {};
    let totalValue = 0;

    for (const inv of investments) {
      const invValue = inv.holdings.reduce((sum, h) => {
        return sum + h.quantity.toNumber() * h.currentPrice.toNumber();
      }, 0);

      if (!byType[inv.type]) {
        byType[inv.type] = { type: inv.type, value: 0, count: 0 };
      }
      byType[inv.type].value += invValue;
      byType[inv.type].count += 1;
      totalValue += invValue;
    }

    const allocation = Object.values(byType).map((a) => ({
      ...a,
      percent: totalValue > 0 ? (a.value / totalValue) * 100 : 0,
    }));

    return { allocation, totalValue };
  }

  async getSummary(userId: string) {
    const investments = await this.findAll(userId);
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const inv of investments) {
      totalInvested += inv.totalCost;
      totalCurrent += inv.totalValue;
    }

    return {
      totalInvested,
      totalCurrent,
      totalGainLoss: totalCurrent - totalInvested,
      gainLossPercent: totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0,
      investmentCount: investments.length,
    };
  }

  private enrichInvestment(
    investment: {
      id: string;
      userId: string;
      name: string;
      type: string;
      symbol: string | null;
      currency: string;
      holdings: Array<{
        id: string;
        quantity: Decimal;
        averageCost: Decimal;
        currentPrice: Decimal;
      }>;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    const holdings = investment.holdings.map((h) => this.formatHolding(h));
    const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
    const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);

    return {
      ...investment,
      holdings,
      totalCost,
      totalValue,
      gainLoss: totalValue - totalCost,
      gainLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    };
  }

  private formatHolding(holding: {
    id: string;
    quantity: Decimal;
    averageCost: Decimal;
    currentPrice: Decimal;
    investmentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    const quantity = holding.quantity.toNumber();
    const averageCost = holding.averageCost.toNumber();
    const currentPrice = holding.currentPrice.toNumber();
    const costBasis = quantity * averageCost;
    const currentValue = quantity * currentPrice;

    return {
      id: holding.id,
      investmentId: holding.investmentId,
      quantity,
      averageCost,
      currentPrice,
      costBasis,
      currentValue,
      gainLoss: currentValue - costBasis,
      gainLossPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0,
    };
  }
}
