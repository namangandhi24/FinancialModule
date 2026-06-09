import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAccountInput,
  UpdateAccountInput,
  AccountQuery,
  isLiabilityAccount,
} from '@finpilot/shared';
import { AuditAction, AccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: AccountQuery) {
    return this.prisma.account.findMany({
      where: {
        userId,
        ...(query.type && { type: query.type }),
        ...(query.status && { status: query.status }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async create(userId: string, input: CreateAccountInput) {
    try {
      return await this.prisma.account.create({
        data: {
          userId,
          name: input.name,
          type: input.type,
          institution: input.institution,
          balance: new Decimal(Math.abs(input.balance)),
          currency: input.currency,
          status: input.status,
        },
      });
    } catch {
      throw new ConflictException('Account with this name and type already exists');
    }
  }

  async update(userId: string, id: string, input: UpdateAccountInput) {
    await this.findOne(userId, id);

    return this.prisma.account.update({
      where: { id },
      data: {
        ...input,
        ...(input.balance !== undefined && {
          balance: new Decimal(Math.abs(input.balance)),
        }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const account = await this.findOne(userId, id);

    const txCount = await this.prisma.transaction.count({
      where: { accountId: id },
    });

    if (txCount > 0) {
      throw new ForbiddenException(
        'Cannot delete account with transactions. Archive it instead.',
      );
    }

    await this.prisma.account.delete({ where: { id } });
    return account;
  }

  getSignedBalance(type: AccountType, balance: Decimal | number): number {
    const num = typeof balance === 'number' ? balance : balance.toNumber();
    return isLiabilityAccount(type as Parameters<typeof isLiabilityAccount>[0])
      ? -Math.abs(num)
      : num;
  }
}

export { AuditAction };
