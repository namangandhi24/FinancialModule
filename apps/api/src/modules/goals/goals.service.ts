import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalInput, UpdateGoalInput } from '@finpilot/shared';
import { GoalStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface GoalProgress {
  progressPercent: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  achievementProbability: number;
  onTrack: boolean;
}

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  computeProgress(goal: {
    targetAmount: Decimal;
    currentSavings: Decimal;
    monthlyContribution: Decimal;
    targetDate: Date;
    status: GoalStatus;
  }): GoalProgress {
    const target = goal.targetAmount.toNumber();
    const current = goal.currentSavings.toNumber();
    const monthly = goal.monthlyContribution.toNumber();

    const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = Math.max(
      0,
      (targetDate.getFullYear() - now.getFullYear()) * 12 +
        (targetDate.getMonth() - now.getMonth()),
    );

    const remaining = Math.max(0, target - current);
    const requiredMonthlySavings =
      monthsRemaining > 0 ? remaining / monthsRemaining : remaining;

    let achievementProbability = 100;
    if (requiredMonthlySavings > 0) {
      achievementProbability = Math.min(100, (monthly / requiredMonthlySavings) * 100);
    }

    return {
      progressPercent,
      monthsRemaining,
      requiredMonthlySavings,
      achievementProbability,
      onTrack: monthly >= requiredMonthlySavings || goal.status === GoalStatus.COMPLETED,
    };
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
    });

    return goals.map((g) => ({
      ...g,
      targetAmount: g.targetAmount.toNumber(),
      currentSavings: g.currentSavings.toNumber(),
      monthlyContribution: g.monthlyContribution.toNumber(),
      progress: this.computeProgress(g),
    }));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    return {
      ...goal,
      targetAmount: goal.targetAmount.toNumber(),
      currentSavings: goal.currentSavings.toNumber(),
      monthlyContribution: goal.monthlyContribution.toNumber(),
      progress: this.computeProgress(goal),
    };
  }

  async create(userId: string, input: CreateGoalInput) {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: input.name,
        targetAmount: new Decimal(input.targetAmount),
        currentSavings: new Decimal(input.currentSavings ?? 0),
        monthlyContribution: new Decimal(input.monthlyContribution ?? 0),
        targetDate: input.targetDate,
        currency: input.currency,
        status: input.status,
      },
    });

    return {
      ...goal,
      targetAmount: goal.targetAmount.toNumber(),
      currentSavings: goal.currentSavings.toNumber(),
      monthlyContribution: goal.monthlyContribution.toNumber(),
      progress: this.computeProgress(goal),
    };
  }

  async update(userId: string, id: string, input: UpdateGoalInput) {
    await this.findOne(userId, id);

    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...input,
        ...(input.targetAmount !== undefined && { targetAmount: new Decimal(input.targetAmount) }),
        ...(input.currentSavings !== undefined && {
          currentSavings: new Decimal(input.currentSavings),
        }),
        ...(input.monthlyContribution !== undefined && {
          monthlyContribution: new Decimal(input.monthlyContribution),
        }),
      },
    });

    return {
      ...goal,
      targetAmount: goal.targetAmount.toNumber(),
      currentSavings: goal.currentSavings.toNumber(),
      monthlyContribution: goal.monthlyContribution.toNumber(),
      progress: this.computeProgress(goal),
    };
  }

  async remove(userId: string, id: string) {
    const goal = await this.findOne(userId, id);
    await this.prisma.goal.delete({ where: { id } });
    return goal;
  }
}
