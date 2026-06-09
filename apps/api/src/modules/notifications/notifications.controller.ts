import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { notificationsQuerySchema, markNotificationsSchema } from '@finpilot/shared';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(notificationsQuerySchema)) query: { unreadOnly?: boolean; limit?: number },
  ) {
    return this.notificationsService.findAll(user.id, query.unreadOnly, query.limit);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read')
  markRead(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(markNotificationsSchema)) body: { ids?: string[]; markAll?: boolean },
  ) {
    return this.notificationsService.markRead(user.id, body.ids, body.markAll);
  }
}
