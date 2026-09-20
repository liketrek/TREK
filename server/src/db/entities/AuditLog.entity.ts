import { Users } from './Users.entity';
import { defineEntity, p, type Ref, EntityRepository } from '@mikro-orm/core';

export class AuditLog {
  id?: number | null;
  createdAt: Date;
  user?: Ref<Users> | null;
  action!: string;
  resource?: string | null;
  details?: string | null;
  ip?: string | null;
}

export class AuditLogRepository extends EntityRepository<AuditLog> {}

export const AuditLogSchema = defineEntity({
  class: AuditLog,
  repository: () => AuditLogRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    createdAt: p
      .datetime()
      .onCreate(() => new Date())
      .index('idx_audit_log_created'),
    user: () => p.manyToOne(Users).ref().nullable(),
    action: p.text(),
    resource: p.text().nullable(),
    details: p.text().nullable(),
    ip: p.text().nullable(),
  },
});
