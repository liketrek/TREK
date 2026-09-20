import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginActions {
  [PrimaryKeyProp]?: ['pluginId', 'actionKey'];
  pluginId!: string;
  actionKey!: string;
  label!: string;
  hint?: string | null;
  danger: number & Opt = 0;
  sortOrder: number & Opt = 0;
  scope: string & Opt = 'user';
}

export class PluginActionsRepository extends EntityRepository<PluginActions> {}

export const PluginActionsSchema = defineEntity({
  class: PluginActions,
  repository: () => PluginActionsRepository,
  properties: {
    pluginId: p.text().primary(),
    actionKey: p.text().primary(),
    label: p.text(),
    hint: p.text().nullable(),
    danger: p.integer(),
    sortOrder: p.integer(),
    scope: p.text(),
  },
});
