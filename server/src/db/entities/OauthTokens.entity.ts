import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { OauthTokensRepository } from '../repositories/OauthTokens.repository';
import { DbTimestampType } from '../types';
import { OauthClients } from './OauthClients.entity';
import { Users } from './Users.entity';

export class OauthTokens {
  [EntityRepositoryType]?: OauthTokensRepository;
  id!: number & Opt;
  client!: Ref<OauthClients>;
  client_id!: string;
  user!: Ref<Users>;
  user_id!: number;
  access_token_hash!: string;
  refresh_token_hash!: string;
  scopes: string & Opt = '[]';
  access_token_expires_at!: string;
  refresh_token_expires_at!: string;
  revoked_at?: string | null;
  created_at?: string | null;
  parentToken?: Ref<OauthTokens> | null;
  parent_token_id?: number | null;
  audience?: string | null;
  oauth_tokens_collection = new Collection<OauthTokens>(this);
}

export const OauthTokensSchema = defineEntity({
  class: OauthTokens,
  repository: () => OauthTokensRepository,
  uniques: [
    { properties: ['refresh_token_hash'] },
    { properties: ['access_token_hash'] },
  ],
  properties: {
    id: p.integer().primary(),
    client: () => p.manyToOne(OauthClients).ref().name('client_id').deleteRule('cascade').hidden().referencedColumnNames('client_id'),
    client_id: p.text().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_oauth_tokens_user'),
    user_id: p.integer().persist(false).index('idx_oauth_tokens_user'),
    access_token_hash: p.text().unique('idx_oauth_tokens_access'),
    refresh_token_hash: p.text().unique('idx_oauth_tokens_refresh'),
    scopes: p.text().default('[]'),
    access_token_expires_at: p.type(DbTimestampType),
    refresh_token_expires_at: p.type(DbTimestampType),
    revoked_at: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    parentToken: () => p.manyToOne(OauthTokens).ref().deleteRule('no action').nullable().hidden().index('idx_oauth_tokens_parent'),
    parent_token_id: p.integer().nullable().persist(false).index('idx_oauth_tokens_parent'),
    audience: p.text().nullable(),
    oauth_tokens_collection: () => p.oneToMany(OauthTokens).mappedBy('parentToken').hidden(),
  },
});
