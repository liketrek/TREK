import { currentTimestamp } from '../dialect/sql-functions';
import type { CollabLinks } from '../entities/CollabLinks.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `collab_links` row — every scalar column of the entity, incl. the two `persist(false)` relation mirrors (`trip_id`, `user_id`). */
export interface CollabLinkRow {
  id: number;
  trip_id: number;
  user_id: number;
  title: string;
  url: string;
  pinned: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const _collabLinkRowKeys: AssertRowKeys<CollabLinkRow, CollabLinks> = true;

/** CB36/CB38/CB41's joined projection — `l.*, u.username`. */
export interface CollabLinkJoinRow extends CollabLinkRow {
  username: string;
}

type CollabLinksKyselyDB = Pick<DB, 'collab_links' | 'users'>;

/**
 * `collab_links` — pinned/shared trip links. Kysely throughout: `trip_id`/
 * `user_id` are `persist(false)` mirrors (the `TripFilesRepository` class
 * docstring's trap), so a bare QueryBuilder `.select([...])` silently drops
 * them.
 */
export class CollabLinksRepository extends TrekRepository<CollabLinks> {
  private joinedQuery() {
    return this.kysely<CollabLinksKyselyDB>()
      .selectFrom('collab_links as l')
      .innerJoin('users as u', 'u.id', 'l.user_id')
      .selectAll('l')
      .select(['u.username']);
  }

  /**
   * CB36 (`listLinks`) — `SELECT l.*, u.username FROM collab_links l JOIN
   * users u ON u.id = l.user_id WHERE l.trip_id = ? ORDER BY l.pinned DESC,
   * l.created_at DESC`. `trip_id: number`: the service resolves the route's
   * `string | number` id via `toRowId` before calling (rule 15).
   */
  async listForTrip(trip_id: number): Promise<CollabLinkJoinRow[]> {
    return await this.joinedQuery()
      .where('l.trip_id', '=', trip_id)
      .orderBy('l.pinned', 'desc')
      .orderBy('l.created_at', 'desc')
      .execute();
  }

  /** CB39 (`updateLink`'s trip-scoping guard) — `SELECT * FROM collab_links WHERE id = ? AND trip_id = ?`. Full row: the falsy-coercion update (CB40) needs the pre-image to fall back onto. */
  async findInTrip(id: number, trip_id: number): Promise<CollabLinkRow | undefined> {
    return await this.kysely<CollabLinksKyselyDB>()
      .selectFrom('collab_links')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** CB37 (`createLink`) — `INSERT INTO collab_links (trip_id, user_id, title, url, pinned) VALUES (?×5)`. The service trims `title`/`url` before calling (matching the legacy inline `.trim()`). Returns the new row's id. */
  async insertLink(row: {
    trip_id: number | string;
    user_id: number;
    title: string;
    url: string;
    pinned: number;
  }): Promise<number> {
    return await this.insert({
      trip: row.trip_id,
      user: row.user_id,
      title: row.title,
      url: row.url,
      pinned: row.pinned,
    });
  }

  /**
   * CB40 (`updateLink`) — `UPDATE collab_links SET title = ?, url = ?,
   * pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trip_id = ?`.
   * The ONE outlier in this cluster: `|| existing.x` falsy-coercion, NOT the
   * presence-sentinel `CASE` shape `CollabNotesRepository.update`/`CB11`
   * uses (task-5-brief.md's explicit instruction — kept as its own distinct
   * shape). The SERVICE resolves `data.title?.trim() || existing.title` /
   * `data.url?.trim() || existing.url` / `data.pinned === undefined ?
   * existing.pinned : (data.pinned ? 1 : 0)` to final values first (same
   * read-merge-write split as {@link CollabNotesRepository.update}) — this
   * method just writes them, scoped by BOTH `id` AND `trip_id` (unlike
   * CB11's notes update, which the legacy only scopes by `id`).
   */
  async update(id: number, trip_id: number, write: { title: string; url: string; pinned: number }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id, trip: trip_id },
      { title: write.title, url: write.url, pinned: write.pinned, updated_at: currentTimestamp(platform) },
    );
  }

  /** CB38/CB41 (`createLink`'s post-insert re-select, `updateLink`'s post-write re-select) — `SELECT l.*, u.username FROM collab_links l JOIN users u ON u.id = l.user_id WHERE l.id = ?`, same text at both call sites. */
  async findWithUser(id: number): Promise<CollabLinkJoinRow | undefined> {
    return await this.joinedQuery().where('l.id', '=', id).executeTakeFirst();
  }

  /** CB42 (`deleteLink`) — `DELETE FROM collab_links WHERE id = ? AND trip_id = ?`, returns whether a row was actually removed (legacy `.changes > 0`). */
  async deleteScoped(id: number, trip_id: number): Promise<boolean> {
    const affected = await this.nativeDelete({ id, trip: trip_id });
    return affected > 0;
  }
}
