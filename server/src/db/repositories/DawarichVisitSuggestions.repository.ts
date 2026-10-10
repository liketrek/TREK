import { coalesceParam, columnRef } from '../dialect/sql-functions';
import type { DawarichVisitSuggestions } from '../entities/DawarichVisitSuggestions.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** `dawarich_visit_suggestions` — every scalar column, DWS6/DSY3's `SELECT *` shape. */
export interface SuggestionRow {
  id: number;
  user_id: number;
  source_visit_id: string;
  trip_id: number | null;
  name: string;
  lat: number | null;
  lng: number | null;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  local_date: string;
  source_status: string;
  confidence: number | null;
  confidence_band: string | null;
  country_code: string | null;
  state: string;
  target: string | null;
  accepted_place_id: number | null;
  accepted_journal_entry_id: number | null;
  accepted_bucket_list_item_id: number | null;
  matched_bucket_list_item_id: number | null;
  source_hash: string;
  accepted_hash: string | null;
  source_missing_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
}
const _suggestionRowKeys: AssertRowKeys<SuggestionRow, DawarichVisitSuggestions> = true;

/** DWS1/DWS3's joined shape — `SuggestionRow` plus the two `LEFT JOIN`-derived columns. */
export interface SuggestionJoinRow extends SuggestionRow {
  trip_title: string | null;
  matched_bucket_name: string | null;
}

/** The `dawarich_visit_suggestions`/`trips`/`bucket_list` tables DWS1/DWS3's join reads. */
type SuggestionJoinKyselyDB = Pick<DB, 'dawarich_visit_suggestions' | 'trips' | 'bucket_list'>;

/** The `dawarich_visit_suggestions` table a bare `SELECT *` read (DWS6/DSY3) needs. */
type SuggestionAllKyselyDB = Pick<DB, 'dawarich_visit_suggestions'>;

/**
 * The `dawarich_visit_suggestions`/`journey_entries` tables DWS2's
 * `reopenOrphaned` reads. `journey_entries` is 3g's table, read cross-domain
 * over `this.kysely()` — the same "a repository may query any table"
 * convention `JourneyEntriesRepository`'s own cross-domain reads
 * (`listStatsTrips`/`listSuggestedTrips`) already establish — rather than a
 * `JourneyEntriesRepository.existsById` call: 3g's Task 4 (the survivors
 * task that would add that method) had not landed at the time this task
 * ran, and appending to a Journey* repository is outside this task's file
 * set (owned by that concurrent implementer). A single self-contained
 * `NOT EXISTS` subquery inside the SAME `UPDATE` also preserves the legacy
 * statement's one-round-trip shape more faithfully than a JS-side
 * per-row `existsById` loop would have.
 */
type ReopenOrphanedKyselyDB = Pick<DB, 'dawarich_visit_suggestions' | 'journey_entries'>;

/** The narrow shape DSY7's window-candidates read needs. */
interface CandidateRow {
  id: number;
  source_visit_id: string;
  state: string;
}

/** The narrow shape DSY11's wish-holders read needs. */
interface HolderRow {
  id: number;
  source_visit_id: string;
  lat: number | null;
  lng: number | null;
  duration_minutes: number;
}

/**
 * `dawarich_visit_suggestions` — one row per Dawarich stay TREK has synced
 * in, reviewable by the user it belongs to. Depends on
 * `DawarichConnectionsRepository` (via `DawarichService`) for credentials;
 * reaches `journey_entries` (3g), `places` (3c, additive `PlacesRepository
 * .setSource`) and `bucket_list` (3f, additive `BucketListRepository`
 * methods) cross-domain.
 */
export class DawarichVisitSuggestionsRepository extends TrekRepository<DawarichVisitSuggestions> {
  private joinedQuery() {
    return this.kysely<SuggestionJoinKyselyDB>()
      .selectFrom('dawarich_visit_suggestions as s')
      .leftJoin('trips as t', 't.id', 's.trip_id')
      .leftJoin('bucket_list as b', 'b.id', 's.matched_bucket_list_item_id')
      .selectAll('s')
      .select(['t.title as trip_title', 'b.name as matched_bucket_name']);
  }

  /**
   * DWS1 — `list`: `SELECT s.*, t.title AS trip_title, b.name AS
   * matched_bucket_name FROM dawarich_visit_suggestions s LEFT JOIN trips t
   * LEFT JOIN bucket_list b WHERE (dynamic: s.user_id=? [+ s.trip_id=?] [+
   * s.state=?]) ORDER BY s.started_at DESC, s.id DESC`. **SECURITY**:
   * `user_id` is scoped in SQL, never filtered after — these rows are
   * someone's location history.
   */
  async list(userId: number, filter: { tripId?: number; state?: string }): Promise<SuggestionJoinRow[]> {
    let q = this.joinedQuery().where('s.user_id', '=', userId);
    if (filter.tripId !== undefined) q = q.where('s.trip_id', '=', filter.tripId);
    if (filter.state) q = q.where('s.state', '=', filter.state);
    const rows = await q.orderBy('s.started_at', 'desc').orderBy('s.id', 'desc').execute();
    return rows as SuggestionJoinRow[];
  }

  /**
   * DWS2 — `reopenOrphaned`: put back into review every acceptance whose
   * result no longer exists. Returns the affected-row count (unused by the
   * caller today — `list`'s own re-select after this write is what the
   * service reads — but kept for parity with every other write method here).
   */
  async reopenOrphaned(userId: number): Promise<number> {
    const result = await this.kysely<ReopenOrphanedKyselyDB>()
      .updateTable('dawarich_visit_suggestions')
      .set({
        state: 'new',
        target: null,
        accepted_hash: null,
        accepted_place_id: null,
        accepted_journal_entry_id: null,
        accepted_bucket_list_item_id: null,
      })
      .where('user_id', '=', userId)
      .where('state', '=', 'accepted')
      .where((eb) =>
        eb.or([
          eb.and([eb('target', '=', 'place'), eb('accepted_place_id', 'is', null)]),
          eb.and([eb('target', '=', 'bucket_list'), eb('accepted_bucket_list_item_id', 'is', null)]),
          eb.and([
            eb('target', '=', 'journal'),
            eb.or([
              eb('accepted_journal_entry_id', 'is', null),
              eb.not(
                eb.exists(
                  eb
                    .selectFrom('journey_entries')
                    .select('id')
                    .whereRef('journey_entries.id', '=', 'dawarich_visit_suggestions.accepted_journal_entry_id'),
                ),
              ),
            ]),
          ]),
        ]),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0);
  }

  /** DWS3 — `getOne`: single-row variant of {@link list}'s join. */
  async getOne(userId: number, id: number): Promise<SuggestionJoinRow | null> {
    const row = await this.joinedQuery().where('s.id', '=', id).where('s.user_id', '=', userId).executeTakeFirst();
    return (row as SuggestionJoinRow) ?? null;
  }

  /** DWS4 — `setState`'s guard read: `SELECT id, state FROM dawarich_visit_suggestions WHERE id = ? AND user_id = ?`. */
  async findStateForUser(id: number, userId: number): Promise<{ id: number; state: string } | null> {
    const row = await this.qb('s')
      .select(['s.id', 's.state'])
      .where({ id, user: userId })
      .execute<{ id: number; state: string } | undefined>('get', false);
    return row ?? null;
  }

  /** DWS5 — `setState`: `UPDATE dawarich_visit_suggestions SET state = ? WHERE id = ?`. */
  async setState(id: number, state: string): Promise<void> {
    await this.nativeUpdate({ id }, { state });
  }

  /**
   * DWS6/DSY3 — `SELECT * FROM dawarich_visit_suggestions WHERE id = ? AND
   * user_id = ?` (`accept`'s guard) and `WHERE user_id = ? AND
   * source_visit_id = ?` (`syncTripWindow`'s existing-row read), one shape
   * with a different WHERE — {@link findForUser}/{@link findByUserAndVisit}.
   * Kysely `selectAll()` rather than a MikroORM `qb` read: every
   * `accepted_*`/`trip_id`/`matched_bucket_list_item_id` column is a
   * `persist(false)` shadow FK on this entity, and a plain `SELECT *` over
   * the physical table sidesteps that trap entirely rather than needing a
   * `columnRef`/full-entity-load workaround for each one.
   */
  async findForUser(id: number, userId: number): Promise<SuggestionRow | null> {
    const row = await this.kysely<SuggestionAllKyselyDB>()
      .selectFrom('dawarich_visit_suggestions')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return (row as SuggestionRow) ?? null;
  }

  /** DSY3 — `syncTripWindow`'s existing-row read: `SELECT * FROM dawarich_visit_suggestions WHERE user_id = ? AND source_visit_id = ?`. Implies `UNIQUE(user_id, source_visit_id)` (the entity's own `uniques`). */
  async findByUserAndVisit(userId: number, sourceVisitId: string): Promise<SuggestionRow | null> {
    const row = await this.kysely<SuggestionAllKyselyDB>()
      .selectFrom('dawarich_visit_suggestions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('source_visit_id', '=', sourceVisitId)
      .executeTakeFirst();
    return (row as SuggestionRow) ?? null;
  }

  /** DSY4 — `syncTripWindow`'s not-existing branch: the 17-column `INSERT`, `state` fixed to `'new'`. Returns the new row's id. */
  async insertVisit(data: {
    user_id: number;
    source_visit_id: string;
    trip_id: number | null;
    name: string;
    lat: number | null;
    lng: number | null;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
    local_date: string;
    source_status: string;
    confidence: number | null;
    confidence_band: string | null;
    country_code: string | null;
    source_hash: string;
    first_seen_at: string;
    last_seen_at: string;
  }): Promise<number> {
    return await this.insert({
      user: data.user_id,
      source_visit_id: data.source_visit_id,
      trip: data.trip_id,
      name: data.name,
      lat: data.lat,
      lng: data.lng,
      started_at: data.started_at,
      ended_at: data.ended_at,
      duration_minutes: data.duration_minutes,
      local_date: data.local_date,
      source_status: data.source_status,
      confidence: data.confidence,
      confidence_band: data.confidence_band,
      country_code: data.country_code,
      state: 'new',
      source_hash: data.source_hash,
      first_seen_at: data.first_seen_at,
      last_seen_at: data.last_seen_at,
    });
  }

  /** DSY5 — `syncTripWindow`'s existing, `state='new'` branch: the full 15-column overwrite (a stay nobody has acted on yet). */
  async updateNewVisit(
    id: number,
    data: {
      name: string;
      lat: number | null;
      lng: number | null;
      started_at: string;
      ended_at: string;
      duration_minutes: number;
      local_date: string;
      source_status: string;
      confidence: number | null;
      confidence_band: string | null;
      country_code: string | null;
      source_hash: string;
      trip_id: number | null;
      last_seen_at: string;
    },
  ): Promise<void> {
    await this.nativeUpdate(
      { id },
      {
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        started_at: data.started_at,
        ended_at: data.ended_at,
        duration_minutes: data.duration_minutes,
        local_date: data.local_date,
        source_status: data.source_status,
        confidence: data.confidence,
        confidence_band: data.confidence_band,
        country_code: data.country_code,
        source_hash: data.source_hash,
        source_missing_at: null,
        trip: data.trip_id,
        last_seen_at: data.last_seen_at,
      },
    );
  }

  /**
   * DSY6 — `syncTripWindow`'s existing, accepted/dismissed branch: `UPDATE
   * dawarich_visit_suggestions SET source_hash = ?, source_missing_at =
   * NULL, last_seen_at = ? WHERE id = ?`. **PARITY**: "nothing the user can
   * see is rewritten".
   */
  async refreshHash(id: number, sourceHash: string, lastSeenAt: string): Promise<void> {
    await this.nativeUpdate({ id }, { source_hash: sourceHash, source_missing_at: null, last_seen_at: lastSeenAt });
  }

  /** DSY7 — `flagMissing`'s candidates read: `SELECT id, source_visit_id, state FROM dawarich_visit_suggestions WHERE user_id = ? AND trip_id = ? AND local_date >= ? AND local_date <= ?`. **PARITY-CRITICAL**: `local_date` string bounding — see the SERVICE's own doc comment on why. */
  async listCandidatesForWindow(userId: number, tripId: number, from: string, to: string): Promise<CandidateRow[]> {
    return await this.qb('s')
      .select(['s.id', 's.source_visit_id', 's.state'])
      .where({ user: userId, trip: tripId, local_date: { $gte: from, $lte: to } })
      .execute<CandidateRow[]>('all', false);
  }

  /** DSY8 — `flagMissing`'s delete branch (only unseen `'new'`-state rows): `DELETE FROM dawarich_visit_suggestions WHERE id = ?`. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * DSY9 — `flagMissing`'s stamp branch: `UPDATE dawarich_visit_suggestions
   * SET source_missing_at = COALESCE(source_missing_at, ?) WHERE id = ?` —
   * preserves the FIRST-missing timestamp. `coalesceParam` as an UPDATE-SET
   * value (its own documented shape), not a filter key.
   */
  async stampMissingIfUnset(id: number, stamp: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { source_missing_at: coalesceParam(platform, 'source_missing_at', stamp) });
  }

  /**
   * DWS11 — `markAccepted`: `UPDATE dawarich_visit_suggestions SET
   * state='accepted', target=?, accepted_place_id=?,
   * accepted_journal_entry_id=?, accepted_bucket_list_item_id=?,
   * accepted_hash=source_hash WHERE id=?`. **`accepted_hash = source_hash`
   * is a self-column copy** — `columnRef(platform, 'source_hash')`, a
   * column-REFERENCE expression read at UPDATE time, never a bound
   * parameter: binding the row's CURRENT `source_hash` as a literal would
   * freeze it at the moment this method was CALLED, not at the moment the
   * UPDATE actually commits — wrong the instant a concurrent sync run
   * changes `source_hash` between the two. `acceptedPlace`/
   * `acceptedBucketListItem` (relation properties, not their `persist(false)`
   * `_id` mirrors) for the two FK writes; `accepted_journal_entry_id` is a
   * plain persisted integer (journey entries carry no FK back from this
   * table) written directly.
   */
  async markAccepted(
    id: number,
    data: { target: string; placeId: number | null; journalEntryId: number | null; bucketItemId: number | null },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        state: 'accepted',
        target: data.target,
        acceptedPlace: data.placeId,
        accepted_journal_entry_id: data.journalEntryId,
        acceptedBucketListItem: data.bucketItemId,
        accepted_hash: columnRef(platform, 'source_hash'),
      },
    );
  }

  /** DSY11 — `claimWish`'s holders read: `SELECT id, source_visit_id, lat, lng, duration_minutes FROM dawarich_visit_suggestions WHERE user_id = ? AND matched_bucket_list_item_id = ? AND source_visit_id <> ?`. */
  async listHoldersOfWish(userId: number, wishId: number, excludeSourceVisitId: string): Promise<HolderRow[]> {
    return await this.qb('s')
      .select(['s.id', 's.source_visit_id', 's.lat', 's.lng', 's.duration_minutes'])
      .where({ user: userId, matchedBucketListItem: wishId, source_visit_id: { $ne: excludeSourceVisitId } })
      .execute<HolderRow[]>('all', false);
  }

  /** DSY12 — `claimWish` (same TX as {@link assignWishHolder}, order matters): `UPDATE dawarich_visit_suggestions SET matched_bucket_list_item_id = NULL WHERE user_id = ? AND matched_bucket_list_item_id = ?` — clears every previous holder. */
  async clearWishHolders(userId: number, wishId: number): Promise<void> {
    await this.nativeUpdate({ user: userId, matchedBucketListItem: wishId }, { matchedBucketListItem: null });
  }

  /** DSY13 — `claimWish`: `UPDATE dawarich_visit_suggestions SET matched_bucket_list_item_id = ? WHERE user_id = ? AND source_visit_id = ?` — assigns the winner. Called AFTER {@link clearWishHolders} in the same transaction, never before. */
  async assignWishHolder(userId: number, sourceVisitId: string, wishId: number): Promise<void> {
    await this.nativeUpdate({ user: userId, source_visit_id: sourceVisitId }, { matchedBucketListItem: wishId });
  }

  /** DWS14 — `matchedStayStart`: `SELECT started_at FROM dawarich_visit_suggestions WHERE user_id = ? AND matched_bucket_list_item_id = ? ORDER BY started_at DESC LIMIT 1`. */
  async matchedStayStart(userId: number, itemId: number): Promise<string | null> {
    const row = await this.qb('s')
      .select(['s.started_at'])
      .where({ user: userId, matchedBucketListItem: itemId })
      .orderBy({ started_at: 'desc' })
      .limit(1)
      .execute<{ started_at: string } | undefined>('get', false);
    return row?.started_at ?? null;
  }
}
