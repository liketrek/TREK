import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PluginOauthTokensRepository } from '../repositories/PluginOauthTokens.repository';

export class PluginOauthTokens {
  [EntityRepositoryType]?: PluginOauthTokensRepository;
  [PrimaryKeyProp]?: ['plugin_id', 'user_id'];
  plugin_id!: string;
  user_id!: number;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  scope?: string | null;
  updated_at!: string & Opt;
}

export const PluginOauthTokensSchema = defineEntity({
  class: PluginOauthTokens,
  repository: () => PluginOauthTokensRepository,
  properties: {
    plugin_id: p.text().primary(),
    user_id: p.integer().primary(),
    access_token: p.text().nullable(),
    refresh_token: p.text().nullable(),
    expires_at: p.integer().nullable(),
    scope: p.text().nullable(),
    updated_at: p.text().defaultRaw(`(datetime('now'))`),
  },
});
