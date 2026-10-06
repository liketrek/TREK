import type { CollectionPlaceRatings } from '../entities/CollectionPlaceRatings.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `collection_place_ratings` (Plan 3h Task 2, part B — #1435's per-voter
 * star ratings on a saved place). A real entity/composite-unique table
 * (`uniques: [{ properties: ['collectionPlace', 'user'] }]`, Task 0's
 * entity/repository population table), unlike the two pivot tables this
 * plan's own `collection_place_tags`/`collection_place_labels` conversions
 * route through `CollectionPlacesRepository`'s Kysely bridge — writes here
 * go through the MikroORM entity API using the entity's own relation
 * property names (`collectionPlace`/`user`), `PlaceRatingsRepository
 * .upsertRating`'s exact precedent for the sibling `place_ratings` table.
 */
export class CollectionPlaceRatingsRepository extends TrekRepository<CollectionPlaceRatings> {
  /**
   * CL52 (`setRating`, `rating === null` branch) — `DELETE FROM
   * collection_place_ratings WHERE collection_place_id=? AND user_id=?`.
   */
  async deleteRating(collectionPlaceId: number, userId: number): Promise<void> {
    await this.nativeDelete({ collectionPlace: collectionPlaceId, user: userId });
  }

  /**
   * CL53 (`setRating`, `rating !== null` branch) — `INSERT INTO
   * collection_place_ratings (collection_place_id, user_id, rating) VALUES
   * (?, ?, ?) ON CONFLICT(collection_place_id, user_id) DO UPDATE SET
   * rating = excluded.rating`. A STRAIGHTFORWARD blind-overwrite composite
   * upsert (the brief's own framing, confirmed against
   * `PlaceRatingsRepository.upsertRating`, the closer precedent than R4's
   * additive-counter shape): `onConflictFields: ['collectionPlace', 'user']`
   * on the entity's own declared composite unique (property names, not
   * column names — `collection_place_id`/`user_id` are `persist(false)`
   * mirrors of those two relations), `onConflictMergeFields: ['rating']`
   * so a future column never silently joins the merge set (same reasoning
   * `PlaceRatingsRepository.upsertRating`'s own docstring gives).
   */
  async upsertRating(collectionPlaceId: number, userId: number, rating: number): Promise<void> {
    await this.upsert(
      { collectionPlace: collectionPlaceId, user: userId, rating },
      { onConflictFields: ['collectionPlace', 'user'], onConflictAction: 'merge', onConflictMergeFields: ['rating'] },
    );
  }

  /**
   * CL41 (`copyTripRatings`, PREPARED/looped) — `INSERT OR IGNORE INTO
   * collection_place_ratings (collection_place_id, user_id, rating) VALUES
   * (?, ?, ?)`. Distinct from {@link upsertRating}'s `DO UPDATE` shape — a
   * vote already carried over from a prior copy is left alone, not
   * overwritten, `onConflictAction: 'ignore'` on the same composite unique.
   */
  async insertIgnoreRating(collectionPlaceId: number, userId: number, rating: number): Promise<void> {
    await this.upsert(
      { collectionPlace: collectionPlaceId, user: userId, rating },
      { onConflictFields: ['collectionPlace', 'user'], onConflictAction: 'ignore' },
    );
  }

  /**
   * CL68 (`copyToTrip`, loop, TX) — `SELECT user_id, rating FROM
   * collection_place_ratings WHERE collection_place_id=?`. `user_id` is a
   * `persist(false)` relation mirror — Kysely, the program-wide "bare
   * mirror column silently dropped" trap (3d/3e ledgers).
   */
  async listForPlace(collectionPlaceId: number): Promise<{ user_id: number; rating: number }[]> {
    return await this.kysely<{
      collection_place_ratings: { collection_place_id: number; user_id: number; rating: number };
    }>()
      .selectFrom('collection_place_ratings')
      .select(['user_id', 'rating'])
      .where('collection_place_id', '=', collectionPlaceId)
      .execute();
  }
}
