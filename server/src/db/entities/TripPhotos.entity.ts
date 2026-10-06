import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripPhotosRepository } from '../repositories/TripPhotos.repository';
import { DbTimestampType } from '../types';
import { TrekPhotos } from './TrekPhotos.entity';
import { TripAlbumLinks } from './TripAlbumLinks.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripPhotos {
  [EntityRepositoryType]?: TripPhotosRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  photo!: Ref<TrekPhotos>;
  photo_id!: number;
  shared: number & Opt = 1;
  albumLink?: Ref<TripAlbumLinks> | null;
  album_link_id?: number | null;
  added_at?: string | null;
}

export const TripPhotosSchema = defineEntity({
  class: TripPhotos,
  repository: () => TripPhotosRepository,
  uniques: [{ properties: ['trip', 'user', 'photo'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_trip_photos_trip'),
    trip_id: p.integer().persist(false).index('idx_trip_photos_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    photo: () => p.manyToOne(TrekPhotos).ref().deleteRule('cascade').hidden().index('idx_trip_photos_photo'),
    photo_id: p.integer().persist(false).index('idx_trip_photos_photo'),
    shared: p.integer().default(1),
    albumLink: () => p.manyToOne(TripAlbumLinks).ref().nullable().hidden(),
    album_link_id: p.integer().nullable().persist(false),
    added_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
