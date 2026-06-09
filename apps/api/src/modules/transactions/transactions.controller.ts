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
  UseInterceptors,
} from '@nestjs/common';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '@finpilot/shared';
import { AuditAction } from '@prisma/client';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { SetAudit } from '../../common/decorators/audit.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditLogInterceptor)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(transactionQuerySchema)) query: Parameters<TransactionsService['findAll']>[1],
  ) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Post()
  @SetAudit('Transaction', AuditAction.CREATE)
  create(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(createTransactionSchema)) body: Parameters<TransactionsService['create']>[1],
  ) {
    return this.transactionsService.create(user.id, body);
  }

  @Patch(':id')
  @SetAudit('Transaction', AuditAction.UPDATE)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(ZodBody(updateTransactionSchema)) body: Parameters<TransactionsService['update']>[2],
  ) {
    return this.transactionsService.update(user.id, id, body);
  }

  @Delete(':id')
  @SetAudit('Transaction', AuditAction.DELETE)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.transactionsService.remove(user.id, id);
  }
}
