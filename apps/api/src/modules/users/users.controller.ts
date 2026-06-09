import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { updateProfileSchema, changePasswordSchema } from '@finpilot/shared';
import { ZodBody } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(updateProfileSchema)) body: Parameters<UsersService['updateProfile']>[1],
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(changePasswordSchema)) body: Parameters<AuthService['changePassword']>[1],
  ) {
    return this.authService.changePassword(user.id, body);
  }
}
