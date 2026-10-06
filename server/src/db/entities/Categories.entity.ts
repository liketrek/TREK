import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CategoriesRepository } from '../repositories/Categories.repository';
import { DbTimestampType } from '../types';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Places } from './Places.entity';
import { Users } from './Users.entity';

export class Categories {
  [EntityRepositoryType]?: CategoriesRepository;
  id!: number & Opt;
  name!: string;
  color?: string | null = '#6366f1';
  icon?: string | null = '📍';
  user?: Ref<Users> | null;
  user_id?: number | null;
  created_at?: string | null;
  collection_places_collection = new Collection<CollectionPlaces>(this);
  places_collection = new Collection<Places>(this);
}

export const CategoriesSchema = defineEntity({
  class: Categories,
  repository: () => CategoriesRepository,
  properties: {
    id: p.integer().primary(),
    name: p.text(),
    color: p.text().nullable(),
    icon: p.text().nullable(),
    user: () => p.manyToOne(Users).ref().nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    collection_places_collection: () => p.oneToMany(CollectionPlaces).mappedBy('category').hidden(),
    places_collection: () => p.oneToMany(Places).mappedBy('category').hidden(),
  },
});
