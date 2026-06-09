import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queues.module';
import { InsightsService } from '../../modules/insights/insights.service';

interface InsightsJobData {
  userId: string;
}

@Injectable()
@Processor(QUEUE_NAMES.INSIGHTS)
export class InsightsProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightsProcessor.name);

  constructor(private insightsService: InsightsService) {
    super();
  }

  async process(job: Job<InsightsJobData>) {
    const { userId } = job.data;
    const result = await this.insightsService.generateInsights(userId);
    this.logger.log(`Generated ${result.generated} insights for user ${userId}`);
    return result;
  }
}
