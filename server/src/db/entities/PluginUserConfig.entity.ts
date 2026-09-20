import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginUserConfig {
  [PrimaryKeyProp]?: ['pluginId', 'userId'];
  pluginId!: string;
  userId!: number;
  config: string & Opt = '{}';
  updatedAt!: string & Opt;
}

export class PluginUserConfigRepository extends EntityRepository<PluginUserConfig> {}

export const PluginUserConfigSchema = defineEntity({
  class: PluginUserConfig,
  repository: () => PluginUserConfigRepository,
  properties: {
    pluginId: p.text().primary(),
    userId: p.integer().primary(),
    config: p.text(),
    updatedAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
