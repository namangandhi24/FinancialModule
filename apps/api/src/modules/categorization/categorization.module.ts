import { Module } from '@nestjs/common';
import { CategorizationService } from './categorization.service';
import { CategorizationController } from './categorization.controller';

@Module({
  controllers: [CategorizationController],
  providers: [CategorizationService],
  exports: [CategorizationService],
})
export class CategorizationModule {}
