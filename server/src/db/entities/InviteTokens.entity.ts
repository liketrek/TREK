import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class InviteTokens {
  id?: number | null;
  token!: string;
  maxUses: number & Opt = 1;
  usedCount: number & Opt = 0;
  expiresAt?: string | null;
  createdBy!: Ref<Users>;
  createdAt?: Date | null;
  trip?: Ref<Trips> | null;
}

export class InviteTokensRepository extends EntityRepository<InviteTokens> {}

export const InviteTokensSchema = defineEntity({
  class: InviteTokens,
  repository: () => InviteTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    token: p.text(),
    maxUses: p.integer(),
    usedCount: p.integer(),
    expiresAt: p.text().nullable(),
    createdBy: () => p.manyToOne(Users).ref().name('created_by').deleteRule('cascade'),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    trip: () => p.manyToOne(Trips).ref().nullable(),
  },
});
