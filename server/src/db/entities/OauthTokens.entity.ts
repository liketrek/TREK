import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { OauthClients } from './OauthClients.entity';
import { Users } from './Users.entity';

export class OauthTokens {
  id?: number | null;
  client!: Ref<OauthClients>;
  user!: Ref<Users>;
  accessTokenHash!: string;
  refreshTokenHash!: string;
  scopes: string & Opt = '[]';
  accessTokenExpiresAt!: Date;
  refreshTokenExpiresAt!: Date;
  revokedAt?: Date | null;
  createdAt?: Date | null;
  parentToken?: Ref<OauthTokens> | null;
  audience?: string | null;
  oauthTokensCollection = new Collection<OauthTokens>(this);
}

export class OauthTokensRepository extends EntityRepository<OauthTokens> {}

export const OauthTokensSchema = defineEntity({
  class: OauthTokens,
  repository: () => OauthTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    client: () => p.manyToOne(OauthClients).ref().name('client_id').deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_oauth_tokens_user'),
    accessTokenHash: p.text().unique('idx_oauth_tokens_access'),
    refreshTokenHash: p.text().unique('idx_oauth_tokens_refresh'),
    scopes: p.text(),
    accessTokenExpiresAt: p.datetime(),
    refreshTokenExpiresAt: p.datetime(),
    revokedAt: p.datetime().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    parentToken: () => p.manyToOne(OauthTokens).ref().nullable().index('idx_oauth_tokens_parent'),
    audience: p.text().nullable(),
    oauthTokensCollection: () => p.oneToMany(OauthTokens).mappedBy('parentToken'),
  },
});
