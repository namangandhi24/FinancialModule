import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { insightsQuerySchema } from '@finpilot/shared';
import { ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { InsightsService } from './insights.service';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(insightsQuerySchema)) query: { limit?: number; type?: string },
  ) {
    return this.insightsService.findAll(user.id, query.limit, query.type);
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser) {
    return this.insightsService.enqueueGeneration(user.id);
  }

  @Post('generate/sync')
  generateSync(@CurrentUser() user: AuthUser) {
    return this.insightsService.generateInsights(user.id);
  }
}
