import { Module } from '@nestjs/common';
import { RetirementService } from './retirement.service';
import { RetirementController } from './retirement.controller';

@Module({
  controllers: [RetirementController],
  providers: [RetirementService],
})
export class RetirementModule {}
