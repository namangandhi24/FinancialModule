import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { retirementProjectionSchema } from '@finpilot/shared';
import { ZodBody } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RetirementService } from './retirement.service';

@Controller('retirement')
@UseGuards(JwtAuthGuard)
export class RetirementController {
  constructor(private retirementService: RetirementService) {}

  @Post('project')
  project(@Body(ZodBody(retirementProjectionSchema)) body: Parameters<RetirementService['project']>[0]) {
    return this.retirementService.project(body);
  }
}
