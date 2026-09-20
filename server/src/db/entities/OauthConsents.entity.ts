import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { OauthClients } from './OauthClients.entity';
import { Users } from './Users.entity';

export class OauthConsents {
  id?: number | null;
  client!: Ref<OauthClients>;
  user!: Ref<Users>;
  scopes: string & Opt = '[]';
  updatedAt?: Date | null;
}

export class OauthConsentsRepository extends EntityRepository<OauthConsents> {}

export const OauthConsentsSchema = defineEntity({
  class: OauthConsents,
  repository: () => OauthConsentsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    client: () => p.manyToOne(OauthClients).ref().name('client_id').deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    scopes: p.text(),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
