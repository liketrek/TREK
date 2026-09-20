import { PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginMetaMigrations {
  [PrimaryKeyProp]?: ['pluginId', 'migrationId'];
  pluginId!: string;
  migrationId!: string;
  appliedAt?: Date | null;
}

export class PluginMetaMigrationsRepository extends EntityRepository<PluginMetaMigrations> {}

export const PluginMetaMigrationsSchema = defineEntity({
  class: PluginMetaMigrations,
  repository: () => PluginMetaMigrationsRepository,
  properties: {
    pluginId: p.text().primary(),
    migrationId: p.text().primary(),
    appliedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
