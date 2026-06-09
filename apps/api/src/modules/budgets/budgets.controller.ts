import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetQuerySchema,
  budgetPerformanceQuerySchema,
} from '@finpilot/shared';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(budgetQuerySchema)) query: Parameters<BudgetsService['findAll']>[1],
  ) {
    return this.budgetsService.findAll(user.id, query);
  }

  @Get('performance')
  getPerformance(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(budgetPerformanceQuerySchema)) query: { month?: number; year?: number },
  ) {
    return this.budgetsService.getPerformance(user.id, query.month, query.year);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(createBudgetSchema)) body: Parameters<BudgetsService['create']>[1],
  ) {
    return this.budgetsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(ZodBody(updateBudgetSchema)) body: Parameters<BudgetsService['update']>[2],
  ) {
    return this.budgetsService.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.budgetsService.remove(user.id, id);
  }
}
