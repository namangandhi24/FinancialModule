import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { CategorizationModule } from '../categorization/categorization.module';
import { QueuesModule } from '../../queues/queues.module';

@Module({
  imports: [CategorizationModule, QueuesModule],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
