import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollectionPlaces } from './CollectionPlaces.entity';
import { Places } from './Places.entity';
import { Users } from './Users.entity';

export class Categories {
  id?: number | null;
  name!: string;
  color?: string | null = '#6366f1';
  icon?: string | null = '📍';
  user?: Ref<Users> | null;
  createdAt?: Date | null;
  collectionPlacesCollection = new Collection<CollectionPlaces>(this);
  placesCollection = new Collection<Places>(this);
}

export class CategoriesRepository extends EntityRepository<Categories> {}

export const CategoriesSchema = defineEntity({
  class: Categories,
  repository: () => CategoriesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.text(),
    color: p.text().nullable(),
    icon: p.text().nullable(),
    user: () => p.manyToOne(Users).ref().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    collectionPlacesCollection: () => p.oneToMany(CollectionPlaces).mappedBy('category'),
    placesCollection: () => p.oneToMany(Places).mappedBy('category'),
  },
});
