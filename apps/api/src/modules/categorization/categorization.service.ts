import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategorizationService {
  constructor(private prisma: PrismaService) {}

  async categorize(userId: string, merchantName?: string): Promise<string | null> {
    if (!merchantName) return null;

    const normalized = merchantName.toUpperCase().trim();

    const rules = await this.prisma.categorizationRule.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const rule of rules) {
      if (normalized.includes(rule.pattern.toUpperCase())) {
        return rule.categoryId;
      }
    }

    const others = await this.prisma.category.findFirst({
      where: { slug: 'others', isSystem: true },
    });

    return others?.id || null;
  }

  async createUserRule(userId: string, pattern: string, categoryId: string) {
    return this.prisma.categorizationRule.create({
      data: {
        userId,
        pattern: pattern.toUpperCase(),
        categoryId,
        isSystem: false,
      },
      include: { category: true },
    });
  }

  async listRules(userId: string) {
    return this.prisma.categorizationRule.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ isSystem: 'desc' }, { pattern: 'asc' }],
    });
  }
}
