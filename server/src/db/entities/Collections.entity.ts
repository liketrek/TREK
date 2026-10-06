import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionsRepository } from '../repositories/Collections.repository';
import { DbTimestampType } from '../types';
import { CollectionLabels } from './CollectionLabels.entity';
import { CollectionMembers } from './CollectionMembers.entity';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Users } from './Users.entity';

export class Collections {
  [EntityRepositoryType]?: CollectionsRepository;
  id!: number & Opt;
  owner!: Ref<Users>;
  owner_id!: number;
  name!: string;
  description?: string | null;
  color?: string | null = '#6366f1';
  icon?: string | null = 'Bookmark';
  cover_image?: string | null;
  links?: string | null;
  sort_order?: number | null = 0;
  created_at?: string | null;
  updated_at?: string | null;
  collection_labels_collection = new Collection<CollectionLabels>(this);
  collection_members_collection = new Collection<CollectionMembers>(this);
  collection_places_collection = new Collection<CollectionPlaces>(this);
}

export const CollectionsSchema = defineEntity({
  class: Collections,
  repository: () => CollectionsRepository,
  properties: {
    id: p.integer().primary(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    owner_id: p.integer().persist(false),
    name: p.text(),
    description: p.text().nullable(),
    color: p.text().nullable(),
    icon: p.text().nullable(),
    cover_image: p.text().nullable(),
    links: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    collection_labels_collection: () => p.oneToMany(CollectionLabels).mappedBy('collection').hidden(),
    collection_members_collection: () => p.oneToMany(CollectionMembers).mappedBy('collection').hidden(),
    collection_places_collection: () => p.oneToMany(CollectionPlaces).mappedBy('collection').hidden(),
  },
});
