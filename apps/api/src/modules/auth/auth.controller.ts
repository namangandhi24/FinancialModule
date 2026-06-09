import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  signupSchema,
  loginWith2FASchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enable2FASchema,
  verify2FASchema,
} from '@finpilot/shared';
import { ZodBody } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/auth.decorators';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signup(
    @Body(ZodBody(signupSchema)) body: Parameters<AuthService['signup']>[0],
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.signup(body);
    const loginResult = await this.authService.login(
      { email: body.email, password: body.password },
    );

    if ('requires2FA' in loginResult && loginResult.requires2FA) {
      return loginResult;
    }

    this.setAuthCookies(res, loginResult.accessToken!, loginResult.refreshToken!);
    return { user: loginResult.user! };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body(ZodBody(loginWith2FASchema)) body: Parameters<AuthService['login']>[0],
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      body,
      req.headers['user-agent'],
      req.ip,
    );

    if ('requires2FA' in result && result.requires2FA) {
      return result;
    }

    this.setAuthCookies(res, result.accessToken!, result.refreshToken!);
    return { user: result.user! };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return { message: 'No refresh token' };
    }

    const tokens = await this.authService.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip,
    );

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    await this.authService.logout(req.cookies?.refreshToken, user.id);
    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return { message: 'Logged out' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body(ZodBody(forgotPasswordSchema)) body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body(ZodBody(resetPasswordSchema)) body: Parameters<AuthService['resetPassword']>[0]) {
    return this.authService.resetPassword(body);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: AuthUser) {
    return this.authService.getSessions(user.id);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.authService.revokeSession(user.id, id);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setup2FA(@CurrentUser() user: AuthUser) {
    return this.authService.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  enable2FA(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(enable2FASchema)) body: Parameters<AuthService['enable2FA']>[1],
  ) {
    return this.authService.enable2FA(user.id, body);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  disable2FA(
    @CurrentUser() user: AuthUser,
    @Body(ZodBody(verify2FASchema)) body: Parameters<AuthService['disable2FA']>[1],
  ) {
    return this.authService.disable2FA(user.id, body);
  }

  @Post('oauth/:provider')
  oauthLogin() {
    throw new NotImplementedException('Social login will be available in Phase 2');
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
