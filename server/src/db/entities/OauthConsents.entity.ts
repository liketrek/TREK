import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { OauthConsentsRepository } from '../repositories/OauthConsents.repository';
import { DbTimestampType } from '../types';
import { OauthClients } from './OauthClients.entity';
import { Users } from './Users.entity';

export class OauthConsents {
  [EntityRepositoryType]?: OauthConsentsRepository;
  id!: number & Opt;
  client!: Ref<OauthClients>;
  client_id!: string;
  user!: Ref<Users>;
  user_id!: number;
  scopes: string & Opt = '[]';
  updated_at?: string | null;
}

export const OauthConsentsSchema = defineEntity({
  class: OauthConsents,
  repository: () => OauthConsentsRepository,
  uniques: [{ properties: ['client', 'user'] }],
  properties: {
    id: p.integer().primary(),
    client: () => p.manyToOne(OauthClients).ref().name('client_id').deleteRule('cascade').hidden().referencedColumnNames('client_id'),
    client_id: p.text().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_oauth_consents_user_id'),
    user_id: p.integer().persist(false).index('idx_oauth_consents_user_id'),
    scopes: p.text().default('[]'),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
