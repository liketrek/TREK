import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginEgressHostsRepository } from '../repositories/PluginEgressHosts.repository';

export class PluginEgressHosts {
  [EntityRepositoryType]?: PluginEgressHostsRepository;
  id!: number & Opt;
  plugin_id!: string;
  host!: string;
  created_at!: string & Opt;
}

export const PluginEgressHostsSchema = defineEntity({
  class: PluginEgressHosts,
  repository: () => PluginEgressHostsRepository,
  uniques: [{ properties: ['plugin_id', 'host'] }],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text().index('idx_plugin_egress_hosts_plugin'),
    host: p.text(),
    created_at: p.text().defaultRaw(`(datetime('now'))`),
  },
});
