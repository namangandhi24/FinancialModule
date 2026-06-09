import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  generateForecastSchema,
  forecastQuerySchema,
} from '@finpilot/shared';
import { ZodBody, ZodQuery } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { ForecastsService } from './forecasts.service';

@Controller('forecasts')
@UseGuards(JwtAuthGuard)
export class ForecastsController {
  constructor(private forecastsService: ForecastsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ZodQuery(forecastQuerySchema)) query: { horizon?: number },
  ) {
    return this.forecastsService.findAll(user.id, query.horizon);
  }

  @Post('generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(generateForecastSchema)) body: Parameters<ForecastsService['generate']>[1],
  ) {
    return this.forecastsService.generate(user.id, body);
  }
}
