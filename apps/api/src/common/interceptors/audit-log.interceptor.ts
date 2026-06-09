import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      mergeMap((data) =>
        from(
          (async () => {
            if (user?.id) {
              await this.prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: auditMeta.action,
                  entityType: auditMeta.entityType,
                  entityId: data?.id || null,
                  newValue: auditMeta.action === AuditAction.DELETE ? undefined : data,
                  previousValue:
                    auditMeta.action === AuditAction.DELETE ? data : undefined,
                  ipAddress: request.ip,
                  userAgent: request.headers['user-agent'],
                },
              });
            }
            return data;
          })(),
        ),
      ),
    );
  }
}
