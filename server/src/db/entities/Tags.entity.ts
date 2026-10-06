import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TagsRepository } from '../repositories/Tags.repository';
import { DbTimestampType } from '../types';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Places } from './Places.entity';
import { Users } from './Users.entity';

export class Tags {
  [EntityRepositoryType]?: TagsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  name!: string;
  color?: string | null = '#10b981';
  created_at?: string | null;
  collection_place_tags_inverse = new Collection<CollectionPlaces>(this);
  place_tags_inverse = new Collection<Places>(this);
}

export const TagsSchema = defineEntity({
  class: Tags,
  repository: () => TagsRepository,
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    name: p.text(),
    color: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    collection_place_tags_inverse: () => p.manyToMany(CollectionPlaces).mappedBy('collection_place_tags').hidden(),
    place_tags_inverse: () => p.manyToMany(Places).mappedBy('place_tags').hidden(),
  },
});
