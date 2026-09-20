import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabLinks {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  title!: string;
  url!: string;
  pinned?: number | null = 0;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export class CollabLinksRepository extends EntityRepository<CollabLinks> {}

export const CollabLinksSchema = defineEntity({
  class: CollabLinks,
  repository: () => CollabLinksRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_collab_links_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    title: p.text(),
    url: p.text(),
    pinned: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
