import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PluginActionsRepository } from '../repositories/PluginActions.repository';

export class PluginActions {
  [EntityRepositoryType]?: PluginActionsRepository;
  [PrimaryKeyProp]?: ['plugin_id', 'action_key'];
  plugin_id!: string;
  action_key!: string;
  label!: string;
  hint?: string | null;
  danger: number & Opt = 0;
  sort_order: number & Opt = 0;
  scope: string & Opt = 'user';
}

export const PluginActionsSchema = defineEntity({
  class: PluginActions,
  repository: () => PluginActionsRepository,
  properties: {
    plugin_id: p.text().primary(),
    action_key: p.text().primary(),
    label: p.text(),
    hint: p.text().nullable(),
    danger: p.integer().default(0),
    sort_order: p.integer().default(0),
    scope: p.text().default('user'),
  },
});
