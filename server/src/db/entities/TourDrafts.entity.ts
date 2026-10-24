import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourDraftsRepository } from '../repositories/TourDrafts.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TourDrafts {
  [EntityRepositoryType]?: TourDraftsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  payload!: string;
  updated_at!: string & Opt;
}

export const TourDraftsSchema = defineEntity({
  class: TourDrafts,
  repository: () => TourDraftsRepository,
  uniques: [{ properties: ['trip', 'user'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_tour_drafts_user'),
    user_id: p.integer().persist(false).index('idx_tour_drafts_user'),
    payload: p.text(),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
