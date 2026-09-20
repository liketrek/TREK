import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Collections } from './Collections.entity';

export class CollectionLabels {
  id?: number | null;
  collection!: Ref<Collections>;
  name!: string;
  color?: string | null = '#6366f1';
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  collectionPlaceLabelsInverse = new Collection<CollectionPlaces>(this);
}

export class CollectionLabelsRepository extends EntityRepository<CollectionLabels> {}

export const CollectionLabelsSchema = defineEntity({
  class: CollectionLabels,
  repository: () => CollectionLabelsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').index('idx_collection_labels_collection'),
    name: p.text(),
    color: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    collectionPlaceLabelsInverse: () => p.manyToMany(CollectionPlaces).mappedBy('collectionPlaceLabels'),
  },
});
