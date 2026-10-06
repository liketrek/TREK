import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PlaceRatingsRepository } from '../repositories/PlaceRatings.repository';
import { DbTimestampType } from '../types';
import { Places } from './Places.entity';
import { Users } from './Users.entity';

export class PlaceRatings {
  [EntityRepositoryType]?: PlaceRatingsRepository;
  id!: number & Opt;
  place!: Ref<Places>;
  place_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  rating!: number;
  created_at?: string | null;
}

export const PlaceRatingsSchema = defineEntity({
  class: PlaceRatings,
  repository: () => PlaceRatingsRepository,
  uniques: [{ properties: ['place', 'user'] }],
  properties: {
    id: p.integer().primary(),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').hidden().index('idx_place_ratings_place'),
    place_id: p.integer().persist(false).index('idx_place_ratings_place'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    rating: p.integer(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
