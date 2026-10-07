import { currentTimestamp } from '../dialect/sql-functions';
import type { TripAlbumLinks } from '../entities/TripAlbumLinks.entity';
import { TrekRepository } from './_shared/trek-repository';

/** MA7/MA8's shared row shape — album_id always needed, passphrase only by the sync path (MA8). */
export interface TripAlbumLinkSyncRow {
  album_id: string;
  passphrase: string | null;
}

/**
 * `trip_album_links`'s single-table write shape (Plan 3e Task 7,
 * UM7/UM10). `trip_id`/`id` are typed `number | string` — the legacy
 * statements bound `tripId`/`linkId` raw (T5's raw-bind seam), including the
 * primary-key `id` column in UM10's `DELETE ... WHERE id = ?`.
 */
interface TripAlbumLinksWriteKyselyDB {
  trip_album_links: {
    id: number | string;
    trip_id: number | string;
    user_id: number;
    provider: string;
    album_id: string;
    album_name: string;
    passphrase: string | null;
  };
}

/**
 * UM7's insert-only shape — `id`/`sync_enabled`/`last_synced_at`/`created_at`
 * are autoincrement/defaulted and omitted from `.values()` (the legacy
 * statement's own column list omits them too), so a SEPARATE interface from
 * {@link TripAlbumLinksWriteKyselyDB} (the `FileLinksWriteKyselyDB` /
 * `TripPhotosInsertKyselyDB` precedent) — that one declares `id` as
 * required, which `.insertInto()` would then also require in `.values()`.
 */
interface TripAlbumLinksInsertKyselyDB {
  trip_album_links: {
    trip_id: number | string;
    user_id: number;
    provider: string;
    album_id: string;
    album_name: string;
    passphrase: string | null;
  };
}

/** UM3's joined projection (`UnifiedMemoriesService.listTripAlbumLinks`) — own Kysely shape, one purpose-shaped interface per statement. */
interface TripAlbumLinksListKyselyDB {
  trip_album_links: {
    id: number;
    trip_id: number | string;
    user_id: number;
    provider: string;
    album_id: string;
    album_name: string;
    sync_enabled: number;
    last_synced_at: string | null;
    created_at: string | null;
  };
  users: { id: number; username: string | null };
}

/** UM3's row shape — `tal.*, u.username`. */
export interface TripAlbumLinkListRow {
  id: number;
  trip_id: number | string;
  user_id: number;
  provider: string;
  album_id: string;
  album_name: string;
  sync_enabled: number;
  last_synced_at: string | null;
  created_at: string | null;
  username: string | null;
}

export class TripAlbumLinksRepository extends TrekRepository<TripAlbumLinks> {
  /**
   * MA7 (`getAlbumIdFromLink`) / MA8 (`getAlbumLinkForSync`) — same
   * user-scoped WHERE, different SELECT list in the legacy text
   * (`album_id` alone vs. `album_id, passphrase`); one method serving both,
   * per the inventory's own proposal, since MA7's caller simply ignores the
   * extra `passphrase` column. `SELECT album_id, passphrase FROM
   * trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?` — note
   * this is USER-scoped, not just trip-scoped: a link belongs to the user
   * who created it, not the whole trip.
   */
  async findScoped(id: number, trip_id: number, user_id: number): Promise<TripAlbumLinkSyncRow | null> {
    const row = await this.findOne({ id, trip: trip_id, user: user_id }, { fields: ['album_id', 'passphrase'] });
    return row ? { album_id: row.album_id, passphrase: row.passphrase ?? null } : null;
  }

  /**
   * MA9 — `UPDATE trip_album_links SET last_synced_at = CURRENT_TIMESTAMP
   * WHERE id = ?`. Deliberately unscoped by trip/user, matching the legacy
   * statement: the caller (`syncImmichAlbum`/`syncSynologyAlbum`) has
   * already resolved `linkId` through `findScoped` (MA7/MA8) earlier in the
   * same request, so this write relies entirely on that prior resolution —
   * not a defect to fix here (see the class docstring on `MemoriesAccessService`).
   */
  async touchSyncTime(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { last_synced_at: currentTimestamp(platform) });
  }

  /**
   * UM7 (`UnifiedMemoriesService.createTripAlbumLink`) — `INSERT OR IGNORE
   * INTO trip_album_links (trip_id, user_id, provider, album_id, album_name,
   * passphrase) VALUES (?, ?, ?, ?, ?, ?)`. `(trip, user, provider,
   * album_id)` is the entity's real `uniques` constraint, so `ON CONFLICT
   * (trip_id, user_id, provider, album_id) DO NOTHING` is the exact SQLite
   * equivalent of the legacy `OR IGNORE`. Returns whether a row was actually
   * inserted (legacy `result.changes === 0` drove the "already linked" 409).
   */
  async insertIgnore(row: {
    trip_id: number | string;
    user_id: number;
    provider: string;
    album_id: string;
    album_name: string;
    passphrase: string | null;
  }): Promise<boolean> {
    const result = await this.kysely<TripAlbumLinksInsertKyselyDB>()
      .insertInto('trip_album_links')
      .values({
        trip_id: row.trip_id,
        user_id: row.user_id,
        provider: row.provider,
        album_id: row.album_id,
        album_name: row.album_name,
        passphrase: row.passphrase,
      })
      .onConflict((oc) => oc.columns(['trip_id', 'user_id', 'provider', 'album_id']).doNothing())
      .executeTakeFirst();
    return (result?.numInsertedOrUpdatedRows ?? 0n) > 0n;
  }

  /** UM10 (`UnifiedMemoriesService.removeAlbumLink`, inside its transaction) — `DELETE FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?`. */
  async deleteScoped(id: number | string, trip_id: number | string, user_id: number): Promise<void> {
    await this.kysely<TripAlbumLinksWriteKyselyDB>()
      .deleteFrom('trip_album_links')
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .where('user_id', '=', user_id)
      .execute();
  }

  /**
   * UM3 (`UnifiedMemoriesService.listTripAlbumLinks`) — `SELECT tal.id,
   * tal.trip_id, tal.user_id, tal.provider, tal.album_id, tal.album_name,
   * tal.sync_enabled, tal.last_synced_at, tal.created_at, u.username FROM
   * trip_album_links tal JOIN users u WHERE tal.trip_id = ? AND tal.provider
   * IN (dynamic) ORDER BY tal.created_at ASC`.
   */
  async listForTrip(trip_id: number | string, enabled_providers: string[]): Promise<TripAlbumLinkListRow[]> {
    if (enabled_providers.length === 0) return [];
    const rows = await this.kysely<TripAlbumLinksListKyselyDB>()
      .selectFrom('trip_album_links as tal')
      .innerJoin('users as u', 'u.id', 'tal.user_id')
      .select([
        'tal.id as id',
        'tal.trip_id as trip_id',
        'tal.user_id as user_id',
        'tal.provider as provider',
        'tal.album_id as album_id',
        'tal.album_name as album_name',
        'tal.sync_enabled as sync_enabled',
        'tal.last_synced_at as last_synced_at',
        'tal.created_at as created_at',
        'u.username as username',
      ])
      .where('tal.trip_id', '=', trip_id)
      .where('tal.provider', 'in', enabled_providers)
      .orderBy('tal.created_at', 'asc')
      .execute();
    return rows;
  }
}
