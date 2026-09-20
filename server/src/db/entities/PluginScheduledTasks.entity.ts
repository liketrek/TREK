import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginScheduledTasks {
  id?: number | null;
  pluginId!: string;
  name!: string;
  dueAt!: number;
  payload: string & Opt = 'null';
  everyMs?: number | null;
  createdAt!: string & Opt;
}

export class PluginScheduledTasksRepository extends EntityRepository<PluginScheduledTasks> {}

export const PluginScheduledTasksSchema = defineEntity({
  class: PluginScheduledTasks,
  repository: () => PluginScheduledTasksRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text(),
    name: p.text(),
    dueAt: p.integer().index('idx_plugin_sched_due'),
    payload: p.text(),
    everyMs: p.integer().nullable(),
    createdAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
