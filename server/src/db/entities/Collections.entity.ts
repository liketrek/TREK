import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollectionLabels } from './CollectionLabels.entity';
import { CollectionMembers } from './CollectionMembers.entity';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Users } from './Users.entity';

export class Collections {
  id?: number | null;
  owner!: Ref<Users>;
  name!: string;
  description?: string | null;
  color?: string | null = '#6366f1';
  icon?: string | null = 'Bookmark';
  coverImage?: string | null;
  links?: string | null;
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  collectionLabelsCollection = new Collection<CollectionLabels>(this);
  collectionMembersCollection = new Collection<CollectionMembers>(this);
  collectionPlacesCollection = new Collection<CollectionPlaces>(this);
}

export class CollectionsRepository extends EntityRepository<Collections> {}

export const CollectionsSchema = defineEntity({
  class: Collections,
  repository: () => CollectionsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    name: p.text(),
    description: p.text().nullable(),
    color: p.text().nullable(),
    icon: p.text().nullable(),
    coverImage: p.text().nullable(),
    links: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    collectionLabelsCollection: () => p.oneToMany(CollectionLabels).mappedBy('collection'),
    collectionMembersCollection: () => p.oneToMany(CollectionMembers).mappedBy('collection'),
    collectionPlacesCollection: () => p.oneToMany(CollectionPlaces).mappedBy('collection'),
  },
});
