import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '@finpilot/shared';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async seedSystemCategories() {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await this.prisma.category.findFirst({
        where: { slug: cat.slug, isSystem: true },
      });
      if (!existing) {
        await this.prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            color: cat.color,
            isSystem: true,
          },
        });
      }
    }
  }
}
