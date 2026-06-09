import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { adminUsersQuerySchema, adminAuditQuerySchema } from '@finpilot/shared';
import { ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorators';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('stats')
  stats() {
    return this.adminService.getStats();
  }

  @Get('users')
  users(@Query(ZodQuery(adminUsersQuerySchema)) query: { page?: number; limit?: number }) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @Get('queues')
  queues() {
    return this.adminService.getQueueStats();
  }

  @Get('audit')
  audit(@Query(ZodQuery(adminAuditQuerySchema)) query: { limit?: number }) {
    return this.adminService.getAuditLogs(query.limit);
  }
}
