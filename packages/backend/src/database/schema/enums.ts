import { pgEnum } from 'drizzle-orm/pg-core';
import { AuditLogActions, AuditLogTargetTypes } from '@ProofArchiveSender/types';

export const auditLogActionEnum = pgEnum('audit_log_action', AuditLogActions);
export const auditLogTargetTypeEnum = pgEnum('audit_log_target_type', AuditLogTargetTypes);
