import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripInviteTokens {
  id?: number | null;
  trip!: Ref<Trips>;
  token!: string;
  createdBy?: Ref<Users> | null;
  expiresAt?: string | null;
  createdAt?: Date | null;
}

export class TripInviteTokensRepository extends EntityRepository<TripInviteTokens> {}

export const TripInviteTokensSchema = defineEntity({
  class: TripInviteTokens,
  repository: () => TripInviteTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    token: p.text().index('idx_trip_invite_tokens_token'),
    createdBy: () => p.manyToOne(Users).ref().name('created_by').nullable(),
    expiresAt: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
