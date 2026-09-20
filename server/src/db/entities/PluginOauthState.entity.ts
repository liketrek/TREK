import { PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PluginOauthState {
  [PrimaryKeyProp]?: 'state';
  state?: string | null;
  pluginId!: string;
  userId!: number;
  verifier!: string;
  createdAt!: number;
}

export class PluginOauthStateRepository extends EntityRepository<PluginOauthState> {}

export const PluginOauthStateSchema = defineEntity({
  class: PluginOauthState,
  repository: () => PluginOauthStateRepository,
  properties: {
    state: p.text().primary().nullable(),
    pluginId: p.text(),
    userId: p.integer(),
    verifier: p.text(),
    createdAt: p.integer(),
  },
});
