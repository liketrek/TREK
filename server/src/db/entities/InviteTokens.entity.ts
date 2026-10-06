import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { InviteTokensRepository } from '../repositories/InviteTokens.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class InviteTokens {
  [EntityRepositoryType]?: InviteTokensRepository;
  id!: number & Opt;
  token!: string;
  max_uses: number & Opt = 1;
  used_count: number & Opt = 0;
  expires_at?: string | null;
  created_by!: number;
  created_at?: string | null;
  trip?: Ref<Trips> | null;
  trip_id?: number | null;
  createdByRef!: Ref<Users>;
}

export const InviteTokensSchema = defineEntity({
  class: InviteTokens,
  repository: () => InviteTokensRepository,
  uniques: [{ properties: ['token'] }],
  properties: {
    id: p.integer().primary(),
    token: p.text(),
    max_uses: p.integer().default(1),
    used_count: p.integer().default(0),
    expires_at: p.text().nullable(),
    created_by: p.integer().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    trip: () => p.manyToOne(Trips).ref().nullable().hidden(),
    trip_id: p.integer().nullable().persist(false),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').deleteRule('cascade').hidden(),
  },
});
