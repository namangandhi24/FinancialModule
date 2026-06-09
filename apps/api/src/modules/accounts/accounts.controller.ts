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
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} from '@finpilot/shared';
import { AuditAction } from '@prisma/client';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { SetAudit } from '../../common/decorators/audit.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditLogInterceptor)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(accountQuerySchema)) query: Parameters<AccountsService['findAll']>[1],
  ) {
    return this.accountsService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accountsService.findOne(user.id, id);
  }

  @Post()
  @SetAudit('Account', AuditAction.CREATE)
  create(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(createAccountSchema)) body: Parameters<AccountsService['create']>[1],
  ) {
    return this.accountsService.create(user.id, body);
  }

  @Patch(':id')
  @SetAudit('Account', AuditAction.UPDATE)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(ZodBody(updateAccountSchema)) body: Parameters<AccountsService['update']>[2],
  ) {
    return this.accountsService.update(user.id, id, body);
  }

  @Delete(':id')
  @SetAudit('Account', AuditAction.DELETE)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.accountsService.remove(user.id, id);
  }
}
