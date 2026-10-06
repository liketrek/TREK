import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PluginErrorLogRepository } from '../repositories/PluginErrorLog.repository';
import { DbTimestampType } from '../types';

export class PluginErrorLog {
  [EntityRepositoryType]?: PluginErrorLogRepository;
  id!: number & Opt;
  plugin_id!: string;
  ts?: string | null;
  level: string & Opt = 'error';
  message?: string | null;
  stack?: string | null;
}

export const PluginErrorLogSchema = defineEntity({
  class: PluginErrorLog,
  repository: () => PluginErrorLogRepository,
  indexes: [
    { name: 'idx_plugin_error_log_plugin', properties: ['plugin_id', 'ts'] },
  ],
  properties: {
    id: p.integer().primary(),
    plugin_id: p.text(),
    ts: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    level: p.text().default('error'),
    message: p.text().nullable(),
    stack: p.text().nullable(),
  },
});
