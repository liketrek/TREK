import { type Opt, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginOauthTokens {
  [PrimaryKeyProp]?: ['pluginId', 'userId'];
  pluginId!: string;
  userId!: number;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  scope?: string | null;
  updatedAt!: string & Opt;
}

export class PluginOauthTokensRepository extends EntityRepository<PluginOauthTokens> {}

export const PluginOauthTokensSchema = defineEntity({
  class: PluginOauthTokens,
  repository: () => PluginOauthTokensRepository,
  properties: {
    pluginId: p.text().primary(),
    userId: p.integer().primary(),
    accessToken: p.text().nullable(),
    refreshToken: p.text().nullable(),
    expiresAt: p.integer().nullable(),
    scope: p.text().nullable(),
    updatedAt: p.text().defaultRaw(`(datetime('now'))`),
  },
});
