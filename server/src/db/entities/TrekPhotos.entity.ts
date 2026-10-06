import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TrekPhotosRepository } from '../repositories/TrekPhotos.repository';
import { DbTimestampType } from '../types';
import { JourneyPhotos } from './JourneyPhotos.entity';
import { TripPhotos } from './TripPhotos.entity';
import { Users } from './Users.entity';

export class TrekPhotos {
  [EntityRepositoryType]?: TrekPhotosRepository;
  id!: number & Opt;
  provider!: string;
  asset_id?: string | null;
  owner?: Ref<Users> | null;
  owner_id?: number | null;
  file_path?: string | null;
  thumbnail_path?: string | null;
  width?: number | null;
  height?: number | null;
  created_at?: string | null;
  passphrase?: string | null;
  media_type: string & Opt = 'image';
  duration_ms?: number | null;
  taken_at?: string | null;
  lat?: number | null;
  lng?: number | null;
  journey_photos_collection = new Collection<JourneyPhotos>(this);
  trip_photos_collection = new Collection<TripPhotos>(this);
}

export const TrekPhotosSchema = defineEntity({
  class: TrekPhotos,
  repository: () => TrekPhotosRepository,
  indexes: [
    {
      name: 'idx_trek_photos_geo',
      where: 'lat IS NOT NULL AND lng IS NOT NULL',
      properties: ['lat', 'lng'],
    },
  ],
  uniques: [
    {
      name: 'idx_trek_photos_provider_asset',
      where: 'asset_id IS NOT NULL',
      properties: ['provider', 'asset_id', 'owner_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    provider: p.text(),
    asset_id: p.text().nullable(),
    owner: () => p.manyToOne(Users).ref().nullable().hidden().index('idx_trek_photos_owner'),
    owner_id: p.integer().nullable().persist(false).index('idx_trek_photos_owner'),
    file_path: p.text().nullable(),
    thumbnail_path: p.text().nullable(),
    width: p.integer().nullable(),
    height: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    passphrase: p.text().nullable().defaultRaw(`NULL`),
    media_type: p.text().default('image'),
    duration_ms: p.integer().nullable(),
    taken_at: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    journey_photos_collection: () => p.oneToMany(JourneyPhotos).mappedBy('photo').hidden(),
    trip_photos_collection: () => p.oneToMany(TripPhotos).mappedBy('photo').hidden(),
  },
});
