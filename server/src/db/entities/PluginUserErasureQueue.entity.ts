import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginUserErasureQueueRepository } from '../repositories/PluginUserErasureQueue.repository';

export class PluginUserErasureQueue {
  [EntityRepositoryType]?: PluginUserErasureQueueRepository;
  id!: number & Opt;
  plugin_id!: string;
  user_id!: number;
  created_at!: string & Opt;
}

export const PluginUserErasureQueueSchema = defineEntity({
  class: PluginUserErasureQueue,
  repository: () => PluginUserErasureQueueRepository,
  uniques: [{ properties: ['plugin_id', 'user_id'] }],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text().index('idx_plugin_erasure_plugin'),
    user_id: p.integer(),
    created_at: p.text().defaultRaw(`(datetime('now'))`),
  },
});
