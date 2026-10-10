import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PluginOauthStateRepository } from '../repositories/PluginOauthState.repository';

export class PluginOauthState {
  [EntityRepositoryType]?: PluginOauthStateRepository;
  [PrimaryKeyProp]?: 'state';
  state?: string | null;
  plugin_id!: string;
  user_id!: number;
  verifier!: string;
  created_at!: number;
}

export const PluginOauthStateSchema = defineEntity({
  class: PluginOauthState,
  repository: () => PluginOauthStateRepository,
  properties: {
    state: p.text().primary().nullable(),
    plugin_id: p.text(),
    user_id: p.integer(),
    verifier: p.text(),
    created_at: p.integer(),
  },
});
