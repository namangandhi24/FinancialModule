import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { isAllowedOrigin } from '../../config/allowed-origins';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    if (request.path === '/health') {
      return true;
    }

    // Non-browser API clients using bearer tokens
    if (request.headers.authorization?.startsWith('Bearer ')) {
      return true;
    }

    const clientHeader = request.headers['x-finpilot-client'];
    if (process.env.NODE_ENV === 'production' && clientHeader !== 'web') {
      throw new ForbiddenException('Client verification failed');
    }

    const origin =
      request.headers.origin ||
      this.originFromReferer(request.headers.referer) ||
      undefined;

    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        return true;
      }
      throw new ForbiddenException('Origin verification failed');
    }

    const allowed = this.configService.get<string[]>('allowedOrigins') || [];
    if (!isAllowedOrigin(origin, allowed)) {
      throw new ForbiddenException('Origin verification failed');
    }

    return true;
  }

  private originFromReferer(referer?: string): string | null {
    if (!referer) return null;
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
}
