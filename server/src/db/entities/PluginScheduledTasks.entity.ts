import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginScheduledTasksRepository } from '../repositories/PluginScheduledTasks.repository';

export class PluginScheduledTasks {
  [EntityRepositoryType]?: PluginScheduledTasksRepository;
  id!: number & Opt;
  plugin_id!: string;
  name!: string;
  due_at!: number;
  payload: string & Opt = 'null';
  every_ms?: number | null;
  created_at!: string & Opt;
}

export const PluginScheduledTasksSchema = defineEntity({
  class: PluginScheduledTasks,
  repository: () => PluginScheduledTasksRepository,
  uniques: [{ properties: ['plugin_id', 'name'] }],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text(),
    name: p.text(),
    due_at: p.integer().index('idx_plugin_sched_due'),
    payload: p.text().default('null'),
    every_ms: p.integer().nullable(),
    created_at: p.text().defaultRaw(`(datetime('now'))`),
  },
});
