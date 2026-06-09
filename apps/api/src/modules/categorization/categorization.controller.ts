import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { createCategorizationRuleSchema } from '@finpilot/shared';
import { ZodBody } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { CategorizationService } from './categorization.service';

@Controller('categorization')
@UseGuards(JwtAuthGuard)
export class CategorizationController {
  constructor(private categorizationService: CategorizationService) {}

  @Get('rules')
  listRules(@CurrentUser() user: AuthUser) {
    return this.categorizationService.listRules(user.id);
  }

  @Post('rules')
  createRule(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(createCategorizationRuleSchema)) body: { pattern: string; categoryId: string },
  ) {
    return this.categorizationService.createUserRule(user.id, body.pattern, body.categoryId);
  }
}
