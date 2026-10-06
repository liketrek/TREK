import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollectionPlacesRepository } from '../repositories/CollectionPlaces.repository';
import { DbTimestampType } from '../types';
import { Categories } from './Categories.entity';
import { CollectionLabels } from './CollectionLabels.entity';
import { CollectionPlaceRatings } from './CollectionPlaceRatings.entity';
import { Collections } from './Collections.entity';
import { Tags } from './Tags.entity';
import { Users } from './Users.entity';

export class CollectionPlaces {
  [EntityRepositoryType]?: CollectionPlacesRepository;
  id!: number & Opt;
  collection!: Ref<Collections>;
  collection_id!: number;
  owner!: Ref<Users>;
  owner_id!: number;
  saved_by?: number | null;
  name!: string;
  description?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  category?: Ref<Categories> | null;
  category_id?: number | null;
  price?: number | null;
  currency?: string | null;
  notes?: string | null;
  image_url?: string | null;
  google_place_id?: string | null;
  google_ftid?: string | null;
  osm_id?: string | null;
  website?: string | null;
  phone?: string | null;
  status: string & Opt = 'idea';
  source_trip_id?: number | null;
  source_place_id?: number | null;
  links?: string | null;
  sort_order?: number | null = 0;
  created_at?: string | null;
  updated_at?: string | null;
  savedByRef?: Ref<Users> | null;
  collection_place_labels = new Collection<CollectionLabels>(this);
  collection_place_tags = new Collection<Tags>(this);
  collection_place_ratings_collection = new Collection<CollectionPlaceRatings>(this);
}

export const CollectionPlacesSchema = defineEntity({
  class: CollectionPlaces,
  repository: () => CollectionPlacesRepository,
  properties: {
    id: p.integer().primary(),
    collection: () => p.manyToOne(Collections).ref().deleteRule('cascade').hidden().index('idx_collection_places_collection'),
    collection_id: p.integer().persist(false).index('idx_collection_places_collection'),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    owner_id: p.integer().persist(false),
    saved_by: p.integer().nullable().persist(false),
    name: p.text(),
    description: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    address: p.text().nullable(),
    category: () => p.manyToOne(Categories).ref().nullable().hidden(),
    category_id: p.integer().nullable().persist(false),
    price: p.double().nullable(),
    currency: p.text().nullable(),
    notes: p.text().nullable(),
    image_url: p.text().nullable(),
    google_place_id: p.text().nullable(),
    google_ftid: p.text().nullable(),
    osm_id: p.text().nullable(),
    website: p.text().nullable(),
    phone: p.text().nullable(),
    status: p.text().default('idea'),
    source_trip_id: p.integer().nullable(),
    source_place_id: p.integer().nullable(),
    links: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    savedByRef: () => p.manyToOne(Users).ref().joinColumn('saved_by').nullable().hidden(),
    collection_place_labels: () => p.manyToMany(CollectionLabels).pivotTable('collection_place_labels').joinColumn('collection_place_id').inverseJoinColumn('label_id').hidden(),
    collection_place_tags: () => p.manyToMany(Tags).pivotTable('collection_place_tags').joinColumn('collection_place_id').inverseJoinColumn('tag_id').hidden(),
    collection_place_ratings_collection: () => p.oneToMany(CollectionPlaceRatings).mappedBy('collectionPlace').hidden(),
  },
});
