import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripInviteTokensRepository } from '../repositories/TripInviteTokens.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripInviteTokens {
  [EntityRepositoryType]?: TripInviteTokensRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  token!: string;
  created_by?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
  createdByRef?: Ref<Users> | null;
}

export const TripInviteTokensSchema = defineEntity({
  class: TripInviteTokens,
  repository: () => TripInviteTokensRepository,
  uniques: [{ properties: ['token'] }, { properties: ['trip'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    token: p.text().index('idx_trip_invite_tokens_token'),
    created_by: p.integer().nullable().persist(false),
    expires_at: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').nullable().hidden(),
  },
});
