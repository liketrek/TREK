import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripMemberRemovalsRepository } from '../repositories/TripMemberRemovals.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripMemberRemovals {
  [EntityRepositoryType]?: TripMemberRemovalsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  removed_at!: string & Opt;
}

export const TripMemberRemovalsSchema = defineEntity({
  class: TripMemberRemovals,
  repository: () => TripMemberRemovalsRepository,
  uniques: [{ properties: ['trip', 'user'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_trip_member_removals_user'),
    user_id: p.integer().persist(false).index('idx_trip_member_removals_user'),
    removed_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
