import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SignupInput,
  LoginInput,
  LoginWith2FAInput,
  ResetPasswordInput,
  ChangePasswordInput,
  Verify2FAInput,
} from '@finpilot/shared';
import { AuditAction } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { EncryptionService } from '../../common/crypto/encryption.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private encryptionService: EncryptionService,
  ) {}

  async signup(input: SignupInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        defaultCurrency: input.defaultCurrency,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        defaultCurrency: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginWith2FAInput, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.totpEnabled) {
      if (!input.totpCode) {
        return { requires2FA: true as const, message: 'TOTP code required' };
      }
      const totpValid = authenticator.verify({
        token: input.totpCode,
        secret: this.decryptTotpSecret(user.totpSecret!),
      });
      if (!totpValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.refreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: this.getRefreshExpiryDate(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        defaultCurrency: user.defaultCurrency,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );

    await this.prisma.refreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        userId: stored.user.id,
        userAgent,
        ipAddress,
        expiresAt: this.getRefreshExpiryDate(),
      },
    });

    return tokens;
  }

  async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: this.hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.LOGOUT,
          entityType: 'User',
          entityId: userId,
        },
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    if (this.configService.get<string>('nodeEnv') !== 'production') {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }

    const webUrl = this.configService.get<string>('webUrl');
    await this.emailService.send(
      user.email,
      'Reset your FinPilot password',
      `Reset your password using this link: ${webUrl}/reset-password?token=${resetToken}`,
      `<p>Reset your password: <a href="${webUrl}/reset-password?token=${resetToken}">Click here</a></p>`,
    );

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(input: ResetPasswordInput) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(input.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    await this.revokeAllSessions(payload.sub);

    await this.prisma.auditLog.create({
      data: {
        userId: payload.sub,
        action: AuditAction.PASSWORD_RESET,
        entityType: 'User',
        entityId: payload.sub,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.revokeAllSessions(userId);

    return { message: 'Password changed successfully' };
  }

  async getSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { message: 'Session revoked' };
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: this.encryptionService.encrypt(secret) },
    });

    const otpauthUrl = authenticator.keyuri(user.email, 'FinPilot AI', secret);
    return { secret, otpauthUrl };
  }

  async enable2FA(userId: string, input: Verify2FAInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new BadRequestException('Run 2FA setup first');
    }

    const valid = authenticator.verify({
      token: input.token,
      secret: this.decryptTotpSecret(user.totpSecret),
    });
    if (!valid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return { message: 'Two-factor authentication enabled' };
  }

  async disable2FA(userId: string, input: Verify2FAInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabled || !user.totpSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const valid = authenticator.verify({
      token: input.token,
      secret: this.decryptTotpSecret(user.totpSecret),
    });
    if (!valid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });

    return { message: 'Two-factor authentication disabled' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessExpiry'),
    });

    const refreshToken = randomBytes(32).toString('hex');

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private decryptTotpSecret(stored: string): string {
    return this.encryptionService.decryptIfEncrypted(stored);
  }

  private async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private getRefreshExpiryDate(): Date {
    const expiry = this.configService.get<string>('jwt.refreshExpiry') || '7d';
    const days = parseInt(expiry.replace('d', ''), 10) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
