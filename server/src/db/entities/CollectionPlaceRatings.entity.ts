import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Users } from './Users.entity';

export class CollectionPlaceRatings {
  id?: number | null;
  collectionPlace!: Ref<CollectionPlaces>;
  user!: Ref<Users>;
  rating!: number;
  createdAt?: Date | null;
}

export class CollectionPlaceRatingsRepository extends EntityRepository<CollectionPlaceRatings> {}

export const CollectionPlaceRatingsSchema = defineEntity({
  class: CollectionPlaceRatings,
  repository: () => CollectionPlaceRatingsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    collectionPlace: () => p.manyToOne(CollectionPlaces).ref().deleteRule('cascade').index('idx_collection_place_ratings_place'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    rating: p.integer(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
