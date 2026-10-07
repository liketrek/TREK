import type { TripPhotos } from '../entities/TripPhotos.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `trip_photos`'s single-table write/lookup shape (Plan 3e Task 7,
 * UM4/UM5/UM6/UM8/UM9). `trip_id`/`album_link_id` are typed `number |
 * string` — the legacy statements bound `tripId`/`albumLinkId` raw, straight
 * from the route param, with no `Number()`/`toRowId` conversion (the same
 * T5 raw-bind seam `TripsRepository.findForViewer`'s docstring documents),
 * so this Kysely shape has to accept both to bind the identical value.
 */
interface TripPhotosKyselyDB {
  trip_photos: {
    id: number;
    trip_id: number | string;
    user_id: number;
    photo_id: number;
    shared: number;
    album_link_id: number | string | null;
    added_at: string | null;
  };
}

/**
 * UM4's insert-only shape — `id`/`added_at` are autoincrement/`DEFAULT
 * CURRENT_TIMESTAMP` and omitted from `.values()` (the legacy statement's
 * own column list omits them too), so Kysely's `InsertObject` needs a
 * SEPARATE interface that doesn't declare them (the `FileLinksWriteKyselyDB`
 * precedent) — {@link TripPhotosKyselyDB} declares every column, so passing
 * it to `.insertInto()` would require `id`/`added_at` in every `.values()`.
 */
interface TripPhotosInsertKyselyDB {
  trip_photos: {
    trip_id: number | string;
    user_id: number;
    photo_id: number;
    shared: number;
    album_link_id: number | string | null;
  };
}

/**
 * UM2's joined projection (`UnifiedMemoriesService.listTripPhotos`) — three
 * tables, so its own Kysely shape rather than folding onto
 * {@link TripPhotosKyselyDB} (one purpose-shaped interface per statement,
 * the `FileLinksRepository` precedent).
 */
interface TripPhotosListKyselyDB {
  trip_photos: { trip_id: number | string; user_id: number; photo_id: number; shared: number; added_at: string | null };
  trek_photos: { id: number; asset_id: string | null; provider: string };
  users: { id: number; username: string | null; avatar: string | null };
}

/** UM2's row shape — `tp.photo_id, tkp.asset_id, tkp.provider, tp.user_id, tp.shared, tp.added_at, u.username, u.avatar`. */
export interface TripPhotoListRow {
  photo_id: number;
  asset_id: string | null;
  provider: string;
  user_id: number;
  shared: number;
  added_at: string | null;
  username: string | null;
  avatar: string | null;
}

export class TripPhotosRepository extends TrekRepository<TripPhotos> {
  /**
   * PH10's non-journey half — `SELECT 1 FROM trip_photos WHERE photo_id = ?
   * LIMIT 1`, used by `TrekPhotoRegistrationService.deleteIfOrphan` alongside
   * the `journey_photos` half of the same orphan check, converted onto
   * {@link JourneyPhotosRepository.existsForPhoto} (Plan 3g Task 4).
   */
  async existsForPhoto(photo_id: number): Promise<boolean> {
    const row = await this.findOne({ photo: photo_id }, { fields: ['id'] });
    return !!row;
  }

  /**
   * MA3 — the regular-trip branch of `MemoriesAccessService.canAccessUserPhoto`:
   * is this provider asset shared by this exact user into this exact trip?
   * `SELECT 1 FROM trip_photos tp JOIN trek_photos tkp ON tkp.id = tp.photo_id
   * WHERE tp.user_id = ? AND tkp.asset_id = ? AND tkp.provider = ? AND
   * tp.trip_id = ? AND tp.shared = 1 LIMIT 1`.
   */
  async existsSharedForUser(trip_id: number, user_id: number, asset_id: string, provider: string): Promise<boolean> {
    const row = await this.qb('tp')
      .select(['tp.id'])
      .join('tp.photo', 'tkp')
      .where({
        'tp.user': user_id,
        'tp.trip': trip_id,
        'tp.shared': 1,
        'tkp.asset_id': asset_id,
        'tkp.provider': provider,
      })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * MA5's source data — every trip a photo is shared into (`shared = 1`),
   * for `MemoriesAccessService.canAccessTrekPhoto` to check each one against
   * `TripsRepository.findAccessible` (R4: reuse the existing accessibility
   * builder rather than hand-translating the legacy `EXISTS(...UNION
   * ALL...)` predicate into a second, independent form). Legacy statement:
   * `SELECT 1 FROM trip_photos tp WHERE tp.photo_id = ? AND tp.shared = 1
   * AND EXISTS(...trip_members/trips...) LIMIT 1` — the `EXISTS` half is
   * exactly `findAccessible`'s own predicate, so this method hands back the
   * candidate trip ids and the caller does the short-circuiting `OR` over
   * `findAccessible`'s results instead.
   *
   * Full-row `find()`, not a `fields: ['trip_id']` projection: `trip_id` is a
   * `persist(false)` scalar twin of the `trip` relation, and a narrowed
   * `fields` selection silently drops it from the hydrated result (the same
   * bare-`persist(false)`-select trap `RoadtripDayBoundariesRepository`
   * documents — verified empirically here too, not assumed) — only an
   * unrestricted `find()` (or `columnRef` through a `qb()`) hydrates it.
   */
  async listTripIdsSharedForPhoto(photo_id: number): Promise<number[]> {
    const rows = await this.find({ photo: photo_id, shared: 1 });
    return rows.map((row) => row.trip_id);
  }

  /**
   * UM4 (`UnifiedMemoriesService._addTripPhoto`) — `INSERT OR IGNORE INTO
   * trip_photos (trip_id, user_id, photo_id, shared, album_link_id) VALUES
   * (?, ?, ?, ?, ?)`. `(trip, user, photo)` is the entity's real `uniques`
   * constraint (this file's `TripPhotosSchema`), so `ON CONFLICT
   * (trip_id, user_id, photo_id) DO NOTHING` is the exact SQLite equivalent
   * of the legacy `OR IGNORE`. Returns whether a row was actually inserted
   * (`result.changes > 0` in the legacy code) — `numInsertedOrUpdatedRows`
   * is Kysely's dialect-general affected-row count, 0 when the conflict
   * target already existed and the insert was ignored.
   */
  async insertIgnore(row: {
    trip_id: number | string;
    user_id: number;
    photo_id: number;
    shared: number;
    album_link_id: number | string | null;
  }): Promise<boolean> {
    const result = await this.kysely<TripPhotosInsertKyselyDB>()
      .insertInto('trip_photos')
      .values({
        trip_id: row.trip_id,
        user_id: row.user_id,
        photo_id: row.photo_id,
        shared: row.shared,
        album_link_id: row.album_link_id,
      })
      .onConflict((oc) => oc.columns(['trip_id', 'user_id', 'photo_id']).doNothing())
      .executeTakeFirst();
    return (result?.numInsertedOrUpdatedRows ?? 0n) > 0n;
  }

  /** UM5 (`UnifiedMemoriesService.setTripPhotoSharing`) — `UPDATE trip_photos SET shared = ? WHERE trip_id = ? AND user_id = ? AND photo_id = ?`. */
  async setShared(trip_id: number | string, user_id: number, photo_id: number, shared: number): Promise<void> {
    await this.kysely<TripPhotosKyselyDB>()
      .updateTable('trip_photos')
      .set({ shared })
      .where('trip_id', '=', trip_id)
      .where('user_id', '=', user_id)
      .where('photo_id', '=', photo_id)
      .execute();
  }

  /** UM6 (`UnifiedMemoriesService.removeTripPhoto`) — `DELETE FROM trip_photos WHERE trip_id = ? AND user_id = ? AND photo_id = ?`. */
  async deleteForUserPhoto(trip_id: number | string, user_id: number, photo_id: number): Promise<void> {
    await this.kysely<TripPhotosKyselyDB>()
      .deleteFrom('trip_photos')
      .where('trip_id', '=', trip_id)
      .where('user_id', '=', user_id)
      .where('photo_id', '=', photo_id)
      .execute();
  }

  /** UM8 (`UnifiedMemoriesService.removeAlbumLink`'s pre-tx orphan-candidate list) — `SELECT photo_id FROM trip_photos WHERE trip_id = ? AND album_link_id = ?`. */
  async listPhotoIdsForAlbumLink(trip_id: number | string, album_link_id: number | string): Promise<number[]> {
    const rows = await this.kysely<TripPhotosKyselyDB>()
      .selectFrom('trip_photos')
      .select(['photo_id'])
      .where('trip_id', '=', trip_id)
      .where('album_link_id', '=', album_link_id)
      .execute();
    return rows.map((r) => r.photo_id);
  }

  /** UM9 (`UnifiedMemoriesService.removeAlbumLink`, inside its transaction) — `DELETE FROM trip_photos WHERE trip_id = ? AND album_link_id = ?`. */
  async deleteForAlbumLink(trip_id: number | string, album_link_id: number | string): Promise<void> {
    await this.kysely<TripPhotosKyselyDB>()
      .deleteFrom('trip_photos')
      .where('trip_id', '=', trip_id)
      .where('album_link_id', '=', album_link_id)
      .execute();
  }

  /**
   * UM2 (`UnifiedMemoriesService.listTripPhotos`) — `SELECT tp.photo_id,
   * tkp.asset_id, tkp.provider, tp.user_id, tp.shared, tp.added_at,
   * u.username, u.avatar FROM trip_photos tp JOIN trek_photos tkp JOIN
   * users u WHERE tp.trip_id = ? AND (tp.user_id = ? OR tp.shared = 1) AND
   * tkp.provider IN (dynamic) ORDER BY tp.added_at ASC`. The caller already
   * guards the empty-`enabled_providers` case (`ServiceResult` 400 before
   * this is ever reached); the early return here is defensive, matching an
   * `IN ()` that can never match any row.
   */
  async listForTrip(
    trip_id: number | string,
    user_id: number,
    enabled_providers: string[],
  ): Promise<TripPhotoListRow[]> {
    if (enabled_providers.length === 0) return [];
    const rows = await this.kysely<TripPhotosListKyselyDB>()
      .selectFrom('trip_photos as tp')
      .innerJoin('trek_photos as tkp', 'tkp.id', 'tp.photo_id')
      .innerJoin('users as u', 'u.id', 'tp.user_id')
      .select([
        'tp.photo_id as photo_id',
        'tkp.asset_id as asset_id',
        'tkp.provider as provider',
        'tp.user_id as user_id',
        'tp.shared as shared',
        'tp.added_at as added_at',
        'u.username as username',
        'u.avatar as avatar',
      ])
      .where('tp.trip_id', '=', trip_id)
      .where((eb) => eb.or([eb('tp.user_id', '=', user_id), eb('tp.shared', '=', 1)]))
      .where('tkp.provider', 'in', enabled_providers)
      .orderBy('tp.added_at', 'asc')
      .execute();
    return rows;
  }
}
