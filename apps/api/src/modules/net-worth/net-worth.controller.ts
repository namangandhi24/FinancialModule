import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  netWorthHistoryQuerySchema,
  cashFlowQuerySchema,
  spendingQuerySchema,
} from '@finpilot/shared';
import { ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { NetWorthService } from './net-worth.service';

@Controller('net-worth')
@UseGuards(JwtAuthGuard)
export class NetWorthController {
  constructor(private netWorthService: NetWorthService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.netWorthService.getCurrent(user.id);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(netWorthHistoryQuerySchema)) query: { from?: Date; to?: Date },
  ) {
    return this.netWorthService.getHistory(user.id, query.from, query.to);
  }

  @Get('cash-flow')
  getCashFlow(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(cashFlowQuerySchema)) query: { from?: Date; to?: Date },
  ) {
    return this.netWorthService.getCashFlow(user.id, query.from, query.to);
  }

  @Get('spending')
  getSpending(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(spendingQuerySchema)) query: { from?: Date; to?: Date; limit?: number },
  ) {
    return this.netWorthService.getSpendingByCategory(
      user.id,
      query.from,
      query.to,
      query.limit,
    );
  }
}
