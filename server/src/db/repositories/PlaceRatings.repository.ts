import type { PlaceRatings } from '../entities/PlaceRatings.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** One rated place, from `QueryHelpersService.loadRatingsByPlaceIds` (QH2). */
export interface PlaceRatingForPlaceRow {
  place_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  rating: number;
}

export class PlaceRatingsRepository extends TrekRepository<PlaceRatings> {
  /**
   * `SELECT pr.place_id, pr.user_id, u.username, u.avatar, pr.rating
   *  FROM place_ratings pr JOIN users u ON pr.user_id = u.id
   *  WHERE pr.place_id IN (${…}) ORDER BY pr.created_at`
   * (`query-helpers.service.ts:65-70`, QH2) — the batch loader behind
   * `PlacesService.list`'s ratings column. Empty `placeIds` short-circuits
   * before any query, matching the legacy service method (which never
   * built the `IN (...)` placeholder list for an empty array either).
   */
  async listForPlaces(placeIds: number[]): Promise<PlaceRatingForPlaceRow[]> {
    if (placeIds.length === 0) return [];
    // `pr.place` selects the plain FK scalar as `place_id` (that relation is
    // never separately joined here). `pr.user` IS separately joined (to `u`,
    // for the username/avatar), and selecting a relation property that is
    // ALSO an active join's target makes MikroORM alias the column off the
    // JOINED entity's own primary key (`u__id`) instead of the FK scalar —
    // verified directly, not assumed — so the user id is pulled explicitly
    // off the join instead (`u.id as user_id`), the same "physical alias"
    // shape `Places.repository.ts`'s `'c.name as category_name'` uses.
    // Selecting the `persist(false)` scalar mirror directly (`pr.user_id`)
    // was tried and silently drops the column from the result — also
    // verified directly, not assumed.
    return this.qb('pr')
      .join('pr.user', 'u')
      .select(['pr.place', 'u.id as user_id', 'u.username', 'u.avatar', 'pr.rating'])
      .where({ 'pr.place': { $in: placeIds } })
      .orderBy({ 'pr.created_at': 'asc' })
      .execute<PlaceRatingForPlaceRow[]>('all', false);
  }

  /**
   * PL51 (`places.service.ts::rate`) — `INSERT INTO place_ratings (place_id,
   * user_id, rating) VALUES (?, ?, ?) ON CONFLICT(place_id, user_id) DO
   * UPDATE SET rating = excluded.rating` — the only explicit `ON CONFLICT …
   * DO UPDATE` in the Plan 3c cluster (#1435). `onConflictFields: ['place',
   * 'user']` on the entity's own declared composite unique
   * (`PlaceRatingsSchema`'s `uniques: [{ properties: ['place', 'user'] }]`,
   * itself generated from the migration's `UNIQUE(place_id, user_id)`
   * — verified against both, not assumed). `onConflictMergeFields: ['rating']`
   * is load-bearing, not decorative: without it `em.upsert`'s default merge
   * set is every non-key column, which on THIS entity is only `rating`
   * anyway (`created_at` is the sole other column and is excluded because it
   * is the primary key's sibling default, not a mergeable field) — named
   * explicitly so a future column added to this entity does not silently
   * join the merge set and start touching a column the legacy statement
   * never wrote on conflict. The ruling this method exists to satisfy: a
   * vote must never touch `places.updated_at` (a separate table this
   * statement doesn't reference at all) so it can't 409 another member's
   * `If-Match` — proven by a repository test that reads `places.updated_at`
   * unchanged across a rating write.
   */
  async upsertRating(place_id: number, user_id: number, rating: number): Promise<void> {
    await this.upsert(
      { place: place_id, user: user_id, rating },
      { onConflictFields: ['place', 'user'], onConflictAction: 'merge', onConflictMergeFields: ['rating'] },
    );
  }

  /** PL50 — `DELETE FROM place_ratings WHERE place_id = ? AND user_id = ?` (a null rating clears the vote). */
  async deleteRating(place_id: number, user_id: number): Promise<void> {
    await this.nativeDelete({ place: place_id, user: user_id });
  }

  // ---------------------------------------------------------------------------
  // Plan 3h Task 2 (`CollectionsService`) — additive, cross-domain. Flagged in
  // the task's own report: these touch `place_ratings`, a 3c-owned table,
  // from the collections cluster's own save/copy surface (#1435 vote carry).
  // ---------------------------------------------------------------------------

  /**
   * CL40 (`copyTripRatings`) — `SELECT user_id, rating FROM place_ratings
   * WHERE place_id=?`. `user_id` is a `persist(false)` relation mirror with
   * no active join in this statement — Kysely, the program-wide "bare
   * mirror column silently dropped, with or without a join" trap (3d/3e
   * ledgers; `listForPlaces`'s own docstring above documents the joined
   * variant of the same finding).
   */
  async listVotesForPlace(place_id: number): Promise<{ user_id: number; rating: number }[]> {
    return await this.kysely<Pick<DB, 'place_ratings'>>()
      .selectFrom('place_ratings')
      .select(['user_id', 'rating'])
      .where('place_id', '=', place_id)
      .execute();
  }

  /**
   * CL66 (`copyToTrip`, PREPARED/looped, TX) — `INSERT OR IGNORE INTO
   * place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)`. Distinct
   * from {@link upsertRating}'s `DO UPDATE` shape — a trip member's
   * existing vote on the destination place (unlikely on a freshly copied
   * row, but not impossible if the place already existed) is left alone,
   * `onConflictAction: 'ignore'` on the same `['place', 'user']` composite
   * unique {@link upsertRating} documents.
   */
  async insertIgnore(place_id: number, user_id: number, rating: number): Promise<void> {
    await this.upsert(
      { place: place_id, user: user_id, rating },
      { onConflictFields: ['place', 'user'], onConflictAction: 'ignore' },
    );
  }
}
