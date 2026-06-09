import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  createHoldingSchema,
  updateHoldingSchema,
} from '@finpilot/shared';
import { ZodBody } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { InvestmentsService } from './investments.service';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private investmentsService: InvestmentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.investmentsService.findAll(user.id);
  }

  @Get('allocation')
  getAllocation(@CurrentUser() user: AuthUser) {
    return this.investmentsService.getAllocation(user.id);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser) {
    return this.investmentsService.getSummary(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.investmentsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(createInvestmentSchema)) body: Parameters<InvestmentsService['create']>[1],
  ) {
    return this.investmentsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(ZodBody(updateInvestmentSchema)) body: Parameters<InvestmentsService['update']>[2],
  ) {
    return this.investmentsService.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.investmentsService.remove(user.id, id);
  }

  @Post(':id/holdings')
  addHolding(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(ZodBody(createHoldingSchema)) body: Parameters<InvestmentsService['addHolding']>[2],
  ) {
    return this.investmentsService.addHolding(user.id, id, body);
  }

  @Patch(':id/holdings/:holdingId')
  updateHolding(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('holdingId') holdingId: string,
    @Body(ZodBody(updateHoldingSchema)) body: Parameters<InvestmentsService['updateHolding']>[3],
  ) {
    return this.investmentsService.updateHolding(user.id, id, holdingId, body);
  }

  @Delete(':id/holdings/:holdingId')
  removeHolding(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('holdingId') holdingId: string,
  ) {
    return this.investmentsService.removeHolding(user.id, id, holdingId);
  }
}
