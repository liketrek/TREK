import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PluginMetaMigrationsRepository } from '../repositories/PluginMetaMigrations.repository';
import { DbTimestampType } from '../types';

export class PluginMetaMigrations {
  [EntityRepositoryType]?: PluginMetaMigrationsRepository;
  [PrimaryKeyProp]?: ['plugin_id', 'migration_id'];
  plugin_id!: string;
  migration_id!: string;
  applied_at?: string | null;
}

export const PluginMetaMigrationsSchema = defineEntity({
  class: PluginMetaMigrations,
  repository: () => PluginMetaMigrationsRepository,
  properties: {
    plugin_id: p.text().primary(),
    migration_id: p.text().primary(),
    applied_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
