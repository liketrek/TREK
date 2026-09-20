import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Categories } from './Categories.entity';
import { CollectionLabels } from './CollectionLabels.entity';
import { CollectionPlaceRatings } from './CollectionPlaceRatings.entity';
import { Collections } from './Collections.entity';
import { Tags } from './Tags.entity';
import { Users } from './Users.entity';

export class CollectionPlaces {
  id?: number | null;
  collection!: Ref<Collections>;
  owner!: Ref<Users>;
  savedBy?: Ref<Users> | null;
  name!: string;
  description?: string | null;
  lat?: unknown | null;
  lng?: unknown | null;
  address?: string | null;
  category?: Ref<Categories> | null;
  price?: unknown | null;
  currency?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  googlePlaceId?: string | null;
  googleFtid?: string | null;
  osmId?: string | null;
  website?: string | null;
  phone?: string | null;
  status: string & Opt = 'idea';
  sourceTripId?: number | null;
  sourcePlaceId?: number | null;
  links?: string | null;
  sortOrder?: number | null = 0;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  collectionPlaceLabels = new Collection<CollectionLabels>(this);
  collectionPlaceTags = new Collection<Tags>(this);
  collectionPlaceRatingsCollection = new Collection<CollectionPlaceRatings>(this);
}

export class CollectionPlacesRepository extends EntityRepository<CollectionPlaces> {}

export const CollectionPlacesSchema = defineEntity({
  class: CollectionPlaces,
  repository: () => CollectionPlacesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').index('idx_collection_places_collection'),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    savedBy: () => p.manyToOne(Users).ref().name('saved_by').nullable(),
    name: p.text(),
    description: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    address: p.text().nullable(),
    category: () => p.manyToOne(Categories).ref().nullable(),
    price: p.double().nullable(),
    currency: p.text().nullable(),
    notes: p.text().nullable(),
    imageUrl: p.text().nullable(),
    googlePlaceId: p.text().nullable(),
    googleFtid: p.text().nullable(),
    osmId: p.text().nullable(),
    website: p.text().nullable(),
    phone: p.text().nullable(),
    status: p.text(),
    sourceTripId: p.integer().nullable(),
    sourcePlaceId: p.integer().nullable(),
    links: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    collectionPlaceLabels: () => p.manyToMany(CollectionLabels).pivotTable('collection_place_labels').joinColumn('collection_place_id').inverseJoinColumn('label_id'),
    collectionPlaceTags: () => p.manyToMany(Tags).pivotTable('collection_place_tags').joinColumn('collection_place_id').inverseJoinColumn('tag_id'),
    collectionPlaceRatingsCollection: () => p.oneToMany(CollectionPlaceRatings).mappedBy('collectionPlace'),
  },
});
