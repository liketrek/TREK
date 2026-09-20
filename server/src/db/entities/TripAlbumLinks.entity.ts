import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { TripPhotos } from './TripPhotos.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripAlbumLinks {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  provider!: string;
  albumId!: string;
  albumName: string & Opt = '';
  syncEnabled: number & Opt = 1;
  lastSyncedAt?: Date | null;
  createdAt?: Date | null;
  passphrase?: string | null;
  tripPhotosCollection = new Collection<TripPhotos>(this);
}

export class TripAlbumLinksRepository extends EntityRepository<TripAlbumLinks> {}

export const TripAlbumLinksSchema = defineEntity({
  class: TripAlbumLinks,
  repository: () => TripAlbumLinksRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_trip_album_links_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    provider: p.text(),
    albumId: p.text(),
    albumName: p.text(),
    syncEnabled: p.integer(),
    lastSyncedAt: p.datetime().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    passphrase: p.text().nullable(),
    tripPhotosCollection: () => p.oneToMany(TripPhotos).mappedBy('albumLink'),
  },
});
