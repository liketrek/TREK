import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionPlaceRatingsRepository } from '../repositories/CollectionPlaceRatings.repository';
import { DbTimestampType } from '../types';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Users } from './Users.entity';

export class CollectionPlaceRatings {
  [EntityRepositoryType]?: CollectionPlaceRatingsRepository;
  id!: number & Opt;
  collectionPlace!: Ref<CollectionPlaces>;
  collection_place_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  rating!: number;
  created_at?: string | null;
}

export const CollectionPlaceRatingsSchema = defineEntity({
  class: CollectionPlaceRatings,
  repository: () => CollectionPlaceRatingsRepository,
  uniques: [{ properties: ['collectionPlace', 'user'] }],
  properties: {
    id: p.integer().primary(),
    collectionPlace: () => p.manyToOne(CollectionPlaces).ref().deleteRule('cascade').hidden().index('idx_collection_place_ratings_place'),
    collection_place_id: p.integer().persist(false).index('idx_collection_place_ratings_place'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    rating: p.integer(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
