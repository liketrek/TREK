import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripAlbumLinksRepository } from '../repositories/TripAlbumLinks.repository';
import { DbTimestampType } from '../types';
import { TripPhotos } from './TripPhotos.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripAlbumLinks {
  [EntityRepositoryType]?: TripAlbumLinksRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  provider!: string;
  album_id!: string;
  album_name: string & Opt = '';
  sync_enabled: number & Opt = 1;
  last_synced_at?: string | null;
  created_at?: string | null;
  passphrase?: string | null;
  trip_photos_collection = new Collection<TripPhotos>(this);
}

export const TripAlbumLinksSchema = defineEntity({
  class: TripAlbumLinks,
  repository: () => TripAlbumLinksRepository,
  uniques: [{ properties: ['trip', 'user', 'provider', 'album_id'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_trip_album_links_trip'),
    trip_id: p.integer().persist(false).index('idx_trip_album_links_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    provider: p.text(),
    album_id: p.text(),
    album_name: p.text().default(''),
    sync_enabled: p.integer().default(1),
    last_synced_at: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    passphrase: p.text().nullable().defaultRaw(`NULL`),
    trip_photos_collection: () => p.oneToMany(TripPhotos).mappedBy('albumLink').hidden(),
  },
});
