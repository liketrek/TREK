import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginCapabilityAudit {
  id?: number | null;
  pluginId!: string;
  actingUserId?: number | null;
  method!: string;
  resource?: string | null;
  code!: string;
  ts!: string & Opt;
  prevHash?: string | null;
  hash!: string;
}

export class PluginCapabilityAuditRepository extends EntityRepository<PluginCapabilityAudit> {}

export const PluginCapabilityAuditSchema = defineEntity({
  class: PluginCapabilityAudit,
  repository: () => PluginCapabilityAuditRepository,
  indexes: [{ name: 'idx_plugin_audit_plugin', properties: ['pluginId', 'id'] }],
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text(),
    actingUserId: p.integer().nullable(),
    method: p.text(),
    resource: p.text().nullable(),
    code: p.text(),
    ts: p.text().defaultRaw(`(datetime('now'))`),
    prevHash: p.text().nullable(),
    hash: p.text(),
  },
});
