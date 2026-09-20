import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginErrorLog {
  id?: number | null;
  pluginId!: string;
  ts?: Date | null;
  level: string & Opt = 'error';
  message?: string | null;
  stack?: string | null;
}

export class PluginErrorLogRepository extends EntityRepository<PluginErrorLog> {}

export const PluginErrorLogSchema = defineEntity({
  class: PluginErrorLog,
  repository: () => PluginErrorLogRepository,
  indexes: [
    { name: 'idx_plugin_error_log_plugin', properties: ['pluginId', 'ts'] },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text(),
    ts: p.datetime().nullable().onCreate(() => new Date()),
    level: p.text(),
    message: p.text().nullable(),
    stack: p.text().nullable(),
  },
});
