import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripMembersRepository } from '../repositories/TripMembers.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripMembers {
  [EntityRepositoryType]?: TripMembersRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  invited_by?: number | null;
  added_at?: string | null;
  invitedByRef?: Ref<Users> | null;
}

export const TripMembersSchema = defineEntity({
  class: TripMembers,
  repository: () => TripMembersRepository,
  uniques: [{ properties: ['trip', 'user'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_trip_members_trip_id'),
    trip_id: p.integer().persist(false).index('idx_trip_members_trip_id'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_trip_members_user_id'),
    user_id: p.integer().persist(false).index('idx_trip_members_user_id'),
    invited_by: p.integer().nullable().persist(false),
    added_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    invitedByRef: () => p.manyToOne(Users).ref().joinColumn('invited_by').deleteRule('no action').nullable().hidden(),
  },
});
