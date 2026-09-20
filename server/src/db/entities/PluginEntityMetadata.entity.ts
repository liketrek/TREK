import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginEntityMetadata {
  id?: number | null;
  pluginId!: string;
  entityType!: string;
  entityId!: number;
  key!: string;
  value?: string | null;
  updatedAt!: string & Opt;
}

export class PluginEntityMetadataRepository extends EntityRepository<PluginEntityMetadata> {}

export const PluginEntityMetadataSchema = defineEntity({
  class: PluginEntityMetadata,
  repository: () => PluginEntityMetadataRepository,
  indexes: [
    {
      name: 'idx_plugin_meta_entity',
      properties: ['pluginId', 'entityType', 'entityId'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    pluginId: p.text(),
    entityType: p.text(),
    entityId: p.integer(),
    key: p.text(),
    value: p.text().nullable(),
    updatedAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
