import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { QUEUE_NAMES } from '../../queues/queues.module';
import { NotificationChannel } from '@prisma/client';

export interface CreateNotificationInput {
  title: string;
  message: string;
  channel?: 'IN_APP' | 'EMAIL';
  metadata?: object;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private notificationsQueue: Queue,
  ) {}

  async findAll(userId: string, unreadOnly = false, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async create(userId: string, input: CreateNotificationInput) {
    const channel = (input.channel || 'IN_APP') as NotificationChannel;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: input.title,
        message: input.message,
        channel,
        metadata: input.metadata,
      },
    });

    if (channel === NotificationChannel.EMAIL) {
      await this.notificationsQueue.add('send-email', {
        notificationId: notification.id,
        userId,
      });
    }

    return notification;
  }

  async markRead(userId: string, ids?: string[], markAll = false) {
    if (markAll) {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return { message: 'All notifications marked as read' };
    }

    if (ids?.length) {
      await this.prisma.notification.updateMany({
        where: { userId, id: { in: ids } },
        data: { read: true },
      });
    }

    return { message: 'Notifications marked as read' };
  }

  async sendEmailNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await this.emailService.send(
      user.email,
      notification.title,
      notification.message,
      `<p>${notification.message}</p>`,
    );
  }
}
