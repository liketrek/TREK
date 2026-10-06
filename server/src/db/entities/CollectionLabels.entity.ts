import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionLabelsRepository } from '../repositories/CollectionLabels.repository';
import { DbTimestampType } from '../types';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Collections } from './Collections.entity';

export class CollectionLabels {
  [EntityRepositoryType]?: CollectionLabelsRepository;
  id!: number & Opt;
  collection!: Ref<Collections>;
  collection_id!: number;
  name!: string;
  color?: string | null = '#6366f1';
  sort_order?: number | null = 0;
  created_at?: string | null;
  collection_place_labels_inverse = new Collection<CollectionPlaces>(this);
}

export const CollectionLabelsSchema = defineEntity({
  class: CollectionLabels,
  repository: () => CollectionLabelsRepository,
  properties: {
    id: p.integer().primary(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').hidden().index('idx_collection_labels_collection'),
    collection_id: p.integer().persist(false).index('idx_collection_labels_collection'),
    name: p.text(),
    color: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    collection_place_labels_inverse: () => p.manyToMany(CollectionPlaces).mappedBy('collection_place_labels').hidden(),
  },
});
