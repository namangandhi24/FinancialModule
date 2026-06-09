import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { aiChatSchema, aiConversationQuerySchema } from '@finpilot/shared';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.getStatus();
  }

  @Get('conversations')
  listConversations(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(aiConversationQuerySchema)) query: { limit?: number },
  ) {
    return this.aiService.listConversations(user.id, query.limit);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.aiService.getConversation(user.id, id);
  }

  @Post('chat')
  chat(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(aiChatSchema)) body: Parameters<AiService['chat']>[1],
  ) {
    return this.aiService.chat(user.id, body);
  }
}
