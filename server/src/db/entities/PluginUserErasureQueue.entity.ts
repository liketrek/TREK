import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginUserErasureQueue {
  id?: number | null;
  pluginId!: string;
  userId!: number;
  createdAt!: string & Opt;
}

export class PluginUserErasureQueueRepository extends EntityRepository<PluginUserErasureQueue> {}

export const PluginUserErasureQueueSchema = defineEntity({
  class: PluginUserErasureQueue,
  repository: () => PluginUserErasureQueueRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text().index('idx_plugin_erasure_plugin'),
    userId: p.integer(),
    createdAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
