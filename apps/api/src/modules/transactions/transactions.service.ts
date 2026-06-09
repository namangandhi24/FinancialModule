import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQuery,
} from '@finpilot/shared';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: TransactionQuery) {
    const { page, limit, accountId, categoryId, type, from, to, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(from || to
        ? {
            date: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { merchantName: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, type: true, currency: true } },
          category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: true,
        category: true,
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async create(userId: string, input: CreateTransactionInput) {
    const account = await this.prisma.account.findFirst({
      where: { id: input.accountId, userId },
    });
    if (!account) throw new NotFoundException('Account not found');

    if (input.type === TransactionType.TRANSFER) {
      if (!input.transferToAccountId) {
        throw new BadRequestException('Transfer requires destination account');
      }
      return this.createTransfer(userId, input);
    }

    const merchantId = input.merchant
      ? await this.upsertMerchant(input.merchant)
      : undefined;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: input.accountId,
          amount: new Decimal(input.amount),
          date: input.date,
          merchantId,
          merchantName: input.merchant,
          categoryId: input.categoryId,
          notes: input.notes,
          type: input.type,
          tags: input.tags || [],
        },
        include: {
          account: { select: { id: true, name: true, type: true, currency: true } },
          category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
        },
      }),
      this.prisma.account.update({
        where: { id: input.accountId },
        data: {
          balance: this.adjustBalance(account.balance, input.amount, input.type, 'debit'),
        },
      }),
    ]);

    return transaction;
  }

  async update(userId: string, id: string, input: UpdateTransactionInput) {
    const existing = await this.findOne(userId, id);

    if (input.updatedAt && existing.updatedAt.getTime() !== input.updatedAt.getTime()) {
      throw new ConflictException('Transaction was modified by another request');
    }

    const merchantId =
      input.merchant !== undefined
        ? input.merchant
          ? await this.upsertMerchant(input.merchant)
          : null
        : undefined;

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(input.amount !== undefined && { amount: new Decimal(input.amount) }),
        ...(input.date !== undefined && { date: input.date }),
        ...(input.merchant !== undefined && { merchantName: input.merchant, merchantId }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.tags !== undefined && { tags: input.tags }),
      },
      include: {
        account: { select: { id: true, name: true, type: true, currency: true } },
        category: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      },
    });
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);

    if (transaction.transferGroupId) {
      await this.prisma.transaction.deleteMany({
        where: { transferGroupId: transaction.transferGroupId },
      });
      return transaction;
    }

    await this.prisma.transaction.delete({ where: { id } });
    return transaction;
  }

  private async createTransfer(userId: string, input: CreateTransactionInput) {
    const fromAccount = await this.prisma.account.findFirst({
      where: { id: input.accountId, userId },
    });
    const toAccount = await this.prisma.account.findFirst({
      where: { id: input.transferToAccountId!, userId },
    });

    if (!fromAccount || !toAccount) {
      throw new NotFoundException('One or both accounts not found');
    }

    const transferGroupId = uuidv4();

    const [debit, credit] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: fromAccount.id,
          amount: new Decimal(input.amount),
          date: input.date,
          merchantName: `Transfer to ${toAccount.name}`,
          notes: input.notes,
          type: TransactionType.TRANSFER,
          tags: input.tags || [],
          transferGroupId,
        },
        include: {
          account: { select: { id: true, name: true, type: true, currency: true } },
          category: true,
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          accountId: toAccount.id,
          amount: new Decimal(input.amount),
          date: input.date,
          merchantName: `Transfer from ${fromAccount.name}`,
          notes: input.notes,
          type: TransactionType.TRANSFER,
          tags: input.tags || [],
          transferGroupId,
        },
      }),
      this.prisma.account.update({
        where: { id: fromAccount.id },
        data: {
          balance: fromAccount.balance.minus(new Decimal(input.amount)),
        },
      }),
      this.prisma.account.update({
        where: { id: toAccount.id },
        data: {
          balance: toAccount.balance.plus(new Decimal(input.amount)),
        },
      }),
    ]);

    return debit;
  }

  private adjustBalance(
    currentBalance: Decimal,
    amount: number,
    type: TransactionType,
    direction: 'debit' | 'credit',
  ): Decimal {
    const amt = new Decimal(amount);
    if (type === TransactionType.INCOME) {
      return currentBalance.plus(amt);
    }
    if (type === TransactionType.EXPENSE || type === TransactionType.LOAN_PAYMENT) {
      return currentBalance.minus(amt);
    }
    return direction === 'debit' ? currentBalance.minus(amt) : currentBalance.plus(amt);
  }

  private async upsertMerchant(name: string): Promise<string> {
    const normalized = name.trim().toUpperCase();
    const merchant = await this.prisma.merchant.upsert({
      where: { name: normalized },
      update: {},
      create: { name: normalized },
    });
    return merchant.id;
  }
}
