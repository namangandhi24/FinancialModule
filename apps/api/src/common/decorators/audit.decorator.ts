import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  entityType: string;
  action: AuditAction;
}

export const SetAudit = (entityType: string, action: AuditAction) =>
  SetMetadata(AUDIT_KEY, { entityType, action });
