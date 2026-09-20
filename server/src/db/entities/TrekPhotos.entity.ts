import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { JourneyPhotos } from './JourneyPhotos.entity';
import { TripPhotos } from './TripPhotos.entity';
import { Users } from './Users.entity';

export class TrekPhotos {
  id?: number | null;
  provider!: string;
  assetId?: string | null;
  owner?: Ref<Users> | null;
  filePath?: string | null;
  thumbnailPath?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt?: Date | null;
  passphrase?: string | null;
  mediaType: string & Opt = 'image';
  durationMs?: number | null;
  takenAt?: string | null;
  lat?: unknown | null;
  lng?: unknown | null;
  journeyPhotosCollection = new Collection<JourneyPhotos>(this);
  tripPhotosCollection = new Collection<TripPhotos>(this);
}

export class TrekPhotosRepository extends EntityRepository<TrekPhotos> {}

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
      properties: ['provider', 'assetId', 'owner'],
    },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    provider: p.text(),
    assetId: p.text().nullable(),
    owner: () => p.manyToOne(Users).ref().nullable().index('idx_trek_photos_owner'),
    filePath: p.text().nullable(),
    thumbnailPath: p.text().nullable(),
    width: p.integer().nullable(),
    height: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    passphrase: p.text().nullable(),
    mediaType: p.text(),
    durationMs: p.integer().nullable(),
    takenAt: p.text().nullable(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    journeyPhotosCollection: () => p.oneToMany(JourneyPhotos).mappedBy('photo'),
    tripPhotosCollection: () => p.oneToMany(TripPhotos).mappedBy('photo'),
  },
});
