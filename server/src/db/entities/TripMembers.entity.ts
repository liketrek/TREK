import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripMembers {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  invitedBy?: Ref<Users> | null;
  addedAt?: Date | null;
}

export class TripMembersRepository extends EntityRepository<TripMembers> {}

export const TripMembersSchema = defineEntity({
  class: TripMembers,
  repository: () => TripMembersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_trip_members_trip_id'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_trip_members_user_id'),
    invitedBy: () => p.manyToOne(Users).ref().name('invited_by').nullable(),
    addedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
