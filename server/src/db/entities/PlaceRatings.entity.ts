import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Places } from './Places.entity';
import { Users } from './Users.entity';

export class PlaceRatings {
  id?: number | null;
  place!: Ref<Places>;
  user!: Ref<Users>;
  rating!: number;
  createdAt?: Date | null;
}

export class PlaceRatingsRepository extends EntityRepository<PlaceRatings> {}

export const PlaceRatingsSchema = defineEntity({
  class: PlaceRatings,
  repository: () => PlaceRatingsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').index('idx_place_ratings_place'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    rating: p.integer(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
