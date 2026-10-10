import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PluginUserConfigRepository } from '../repositories/PluginUserConfig.repository';

export class PluginUserConfig {
  [EntityRepositoryType]?: PluginUserConfigRepository;
  [PrimaryKeyProp]?: ['plugin_id', 'user_id'];
  plugin_id!: string;
  user_id!: number;
  config: string & Opt = '{}';
  updated_at!: string & Opt;
}

export const PluginUserConfigSchema = defineEntity({
  class: PluginUserConfig,
  repository: () => PluginUserConfigRepository,
  properties: {
    plugin_id: p.text().primary(),
    user_id: p.integer().primary(),
    config: p.text().default('{}'),
    updated_at: p.text().defaultRaw(`(datetime('now'))`),
  },
});
