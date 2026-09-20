import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { OauthConsents } from './OauthConsents.entity';
import { OauthTokens } from './OauthTokens.entity';
import { Users } from './Users.entity';

export class OauthClients {
  id?: string | null;
  user?: Ref<Users> | null;
  name!: string;
  clientId!: string;
  clientSecretHash!: string;
  redirectUris: string & Opt = '[]';
  allowedScopes: string & Opt = '[]';
  createdAt?: Date | null;
  isPublic: number & Opt = 0;
  createdVia: string & Opt = 'settings_ui';
  allowsClientCredentials: number & Opt = 0;
  oauthConsentsCollection = new Collection<OauthConsents>(this);
  oauthTokensCollection = new Collection<OauthTokens>(this);
}

export class OauthClientsRepository extends EntityRepository<OauthClients> {}

export const OauthClientsSchema = defineEntity({
  class: OauthClients,
  repository: () => OauthClientsRepository,
  properties: {
    id: p.text().primary().nullable(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').nullable().index('idx_oauth_clients_user'),
    name: p.text(),
    clientId: p.text().unique('idx_oauth_clients_client_id'),
    clientSecretHash: p.text(),
    redirectUris: p.text(),
    allowedScopes: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    isPublic: p.integer(),
    createdVia: p.text(),
    allowsClientCredentials: p.integer(),
    oauthConsentsCollection: () => p.oneToMany(OauthConsents).mappedBy('client'),
    oauthTokensCollection: () => p.oneToMany(OauthTokens).mappedBy('client'),
  },
});
