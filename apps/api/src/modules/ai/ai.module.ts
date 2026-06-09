import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiToolsService } from './ai-tools.service';
import { LlmService } from './llm.service';
import { NetWorthModule } from '../net-worth/net-worth.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { GoalsModule } from '../goals/goals.module';
import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [NetWorthModule, BudgetsModule, GoalsModule, InvestmentsModule],
  controllers: [AiController],
  providers: [AiService, AiToolsService, LlmService],
  exports: [AiService],
})
export class AiModule {}
