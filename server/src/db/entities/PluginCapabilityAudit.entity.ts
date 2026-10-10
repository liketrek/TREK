import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginCapabilityAuditRepository } from '../repositories/PluginCapabilityAudit.repository';

export class PluginCapabilityAudit {
  [EntityRepositoryType]?: PluginCapabilityAuditRepository;
  id!: number & Opt;
  plugin_id!: string;
  acting_user_id?: number | null;
  method!: string;
  resource?: string | null;
  code!: string;
  ts!: string & Opt;
  prev_hash?: string | null;
  hash!: string;
}

export const PluginCapabilityAuditSchema = defineEntity({
  class: PluginCapabilityAudit,
  repository: () => PluginCapabilityAuditRepository,
  indexes: [{ name: 'idx_plugin_audit_plugin', properties: ['plugin_id', 'id'] }],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text(),
    acting_user_id: p.integer().nullable(),
    method: p.text(),
    resource: p.text().nullable(),
    code: p.text(),
    ts: p.text().defaultRaw(`(datetime('now'))`),
    prev_hash: p.text().nullable(),
    hash: p.text(),
  },
});
