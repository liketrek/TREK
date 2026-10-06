import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { OauthClientsRepository } from '../repositories/OauthClients.repository';
import { DbTimestampType } from '../types';
import { OauthConsents } from './OauthConsents.entity';
import { OauthTokens } from './OauthTokens.entity';
import { Users } from './Users.entity';

export class OauthClients {
  [EntityRepositoryType]?: OauthClientsRepository;
  id?: string | null;
  user?: Ref<Users> | null;
  user_id?: number | null;
  name!: string;
  client_id!: string;
  client_secret_hash!: string;
  redirect_uris: string & Opt = '[]';
  allowed_scopes: string & Opt = '[]';
  created_at?: string | null;
  is_public: number & Opt = 0;
  created_via: string & Opt = 'settings_ui';
  allows_client_credentials: number & Opt = 0;
  oauth_consents_collection = new Collection<OauthConsents>(this);
  oauth_tokens_collection = new Collection<OauthTokens>(this);
}

export const OauthClientsSchema = defineEntity({
  class: OauthClients,
  repository: () => OauthClientsRepository,
  uniques: [{ properties: ['client_id'] }],
  properties: {
    id: p.text().primary().nullable(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').nullable().hidden().index('idx_oauth_clients_user'),
    user_id: p.integer().nullable().persist(false).index('idx_oauth_clients_user'),
    name: p.text(),
    client_id: p.text().unique('idx_oauth_clients_client_id'),
    client_secret_hash: p.text(),
    redirect_uris: p.text().default('[]'),
    allowed_scopes: p.text().default('[]'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    is_public: p.integer().default(0),
    created_via: p.text().default('settings_ui'),
    allows_client_credentials: p.integer().default(0),
    oauth_consents_collection: () => p.oneToMany(OauthConsents).mappedBy('client').hidden(),
    oauth_tokens_collection: () => p.oneToMany(OauthTokens).mappedBy('client').hidden(),
  },
});
