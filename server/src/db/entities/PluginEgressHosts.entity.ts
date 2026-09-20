import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginEgressHosts {
  id?: number | null;
  pluginId!: string;
  host!: string;
  createdAt!: string & Opt;
}

export class PluginEgressHostsRepository extends EntityRepository<PluginEgressHosts> {}

export const PluginEgressHostsSchema = defineEntity({
  class: PluginEgressHosts,
  repository: () => PluginEgressHostsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text().index('idx_plugin_egress_hosts_plugin'),
    host: p.text(),
    createdAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
