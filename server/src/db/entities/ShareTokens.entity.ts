import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { ShareTokensRepository } from '../repositories/ShareTokens.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class ShareTokens {
  [EntityRepositoryType]?: ShareTokensRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  token!: string;
  created_by!: number;
  share_map?: number | null = 1;
  share_bookings?: number | null = 1;
  share_packing?: number | null = 0;
  share_budget?: number | null = 0;
  share_collab?: number | null = 0;
  created_at?: string | null;
  expires_at?: string | null;
  share_travel_only: number & Opt = 0;
  share_hide_images: number & Opt = 0;
  createdByRef!: Ref<Users>;
}

export const ShareTokensSchema = defineEntity({
  class: ShareTokens,
  repository: () => ShareTokensRepository,
  uniques: [{ properties: ['token'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    token: p.text().index('idx_share_tokens_token'),
    created_by: p.integer().persist(false),
    share_map: p.integer().nullable(),
    share_bookings: p.integer().nullable(),
    share_packing: p.integer().nullable(),
    share_budget: p.integer().nullable(),
    share_collab: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    expires_at: p.text().nullable(),
    share_travel_only: p.integer().default(0),
    share_hide_images: p.integer().default(0),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').hidden(),
  },
});
