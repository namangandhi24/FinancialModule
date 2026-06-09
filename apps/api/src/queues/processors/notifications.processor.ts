import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queues.module';
import { NotificationsService } from '../../modules/notifications/notifications.service';

interface NotificationJobData {
  notificationId: string;
  userId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobData>) {
    const { notificationId, userId } = job.data;
    await this.notificationsService.sendEmailNotification(notificationId, userId);
    this.logger.log(`Email notification sent for ${notificationId}`);
    return { sent: true };
  }
}
