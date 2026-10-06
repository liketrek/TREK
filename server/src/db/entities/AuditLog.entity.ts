import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AuditLogRepository } from '../repositories/AuditLog.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class AuditLog {
  [EntityRepositoryType]?: AuditLogRepository;
  id!: number & Opt;
  created_at?: string | null;
  user?: Ref<Users> | null;
  user_id?: number | null;
  action!: string;
  resource?: string | null;
  details?: string | null;
  ip?: string | null;
}

export const AuditLogSchema = defineEntity({
  class: AuditLog,
  repository: () => AuditLogRepository,
  properties: {
    id: p.integer().primary(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`).index('idx_audit_log_created'),
    user: () => p.manyToOne(Users).ref().nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    action: p.text(),
    resource: p.text().nullable(),
    details: p.text().nullable(),
    ip: p.text().nullable(),
  },
});
