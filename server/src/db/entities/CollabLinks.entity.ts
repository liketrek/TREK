import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabLinksRepository } from '../repositories/CollabLinks.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabLinks {
  [EntityRepositoryType]?: CollabLinksRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  title!: string;
  url!: string;
  pinned?: number | null = 0;
  created_at?: string | null;
  updated_at?: string | null;
}

export const CollabLinksSchema = defineEntity({
  class: CollabLinks,
  repository: () => CollabLinksRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_collab_links_trip'),
    trip_id: p.integer().persist(false).index('idx_collab_links_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    title: p.text(),
    url: p.text(),
    pinned: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
