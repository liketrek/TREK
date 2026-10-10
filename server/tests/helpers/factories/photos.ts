import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../../src/db/entities/TripAlbumLinks.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import type { FactoryOrm } from './context';
import { createRow, findRow, insertRow } from './rows';
import type { EntityDTO } from '@mikro-orm/core';

export type TripPhotoRow = EntityDTO<TripPhotos>;

/**
 * Registers the provider asset in the central photo table (once per
 * provider, asset and owner) and puts it on the trip, private unless
 * `shared` is set.
 */
export async function addTripPhoto(
  orm: FactoryOrm,
  tripId: number,
  userId: number,
  assetId: string,
  provider: string,
  opts: { shared?: boolean; albumLinkId?: number } = {},
): Promise<TripPhotoRow> {
  // Looked up first rather than upserted: the unique index on (provider,
  // asset_id, owner_id) is partial, and SQLite only matches an ON CONFLICT
  // target to a partial index that repeats its WHERE clause.
  const known = await findRow(orm, TrekPhotos, { provider, asset_id: assetId, owner: userId });
  const photoId = known?.id ?? (await insertRow(orm, TrekPhotos, { provider, asset_id: assetId, owner: userId }));
  return createRow(orm, TripPhotos, {
    trip: tripId,
    user: userId,
    photo: photoId,
    shared: opts.shared ? 1 : 0,
    albumLink: opts.albumLinkId ?? null,
  });
}

/** Links a provider album to the trip for the user. */
export function addAlbumLink(
  orm: FactoryOrm,
  tripId: number,
  userId: number,
  provider: string,
  albumId: string,
  albumName = 'Test Album',
): Promise<EntityDTO<TripAlbumLinks>> {
  return createRow(orm, TripAlbumLinks, {
    trip: tripId,
    user: userId,
    provider,
    album_id: albumId,
    album_name: albumName,
  });
}
