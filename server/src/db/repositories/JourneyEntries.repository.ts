import type { JourneyEntry } from '../../types';
import type { JourneyEntries } from '../entities/JourneyEntries.entity';
import { TrekRepository } from './_shared/trek-repository';

/** JG55's wider reconciliation projection (`reconcileTripSkeletons`) — a distinct column set from JG35's dedup-key-only read. */
export interface ReconcileEntryRow {
  id: number;
  source_place_id: number | null;
  source_assignment_id: number | null;
  type: string;
  story: string | null;
  title: string | null;
  entry_date: string | null;
  entry_time: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

/** JG63's `journeyTracks` source row — the places a journey's linked trips carry GPX geometry for. */
export interface JourneyTrackSourceRow {
  place_id: number;
  trip_id: number;
  name: string | null;
  route_color: string | null;
  route_geometry: string;
}

/** The narrow `journey_entries`/`places` shape {@link JourneyEntriesRepository.listTracksSource} needs. */
interface JourneyTracksKyselyDB {
  journey_entries: { journey_id: number; source_trip_id: number | null };
  places: { id: number; trip_id: number; name: string | null; route_color: string | null; route_geometry: string | null };
}

/** The narrow `journey_entries` shape a bare `entry_date`/`sort_order` MAX-per-date read needs. */
interface JourneyEntriesDateSortKyselyDB {
  journey_entries: { journey_id: number; entry_date: string; sort_order: number | null };
}

/** An entry waiting for a place and the geotagged photo that can give it one (#1003), {@link JourneyEntriesRepository.listPhotoPlacementCandidates}. */
export interface PhotoPlacementRow {
  entryId: number;
  journeyId: number;
  lat: number;
  lng: number;
}

/** The narrow `trek_photos`/`journey_photos`/`journey_entry_photos`/`journey_entries`/`journeys` shape {@link JourneyEntriesRepository.listPhotoPlacementCandidates} needs. */
interface PhotoPlacementKyselyDB {
  trek_photos: { id: number; lat: number | null; lng: number | null };
  journey_photos: { id: number; photo_id: number };
  journey_entry_photos: { entry_id: number; journey_photo_id: number; sort_order: number | null };
  journey_entries: { id: number; journey_id: number; location_lat: number | null; location_lng: number | null; type: string };
  journeys: { id: number; photo_location: number };
}

/** `journey_entry_photos`, read cross-table (no `JourneyEntryPhotosRepository` yet — Task 2's own; the two `hasPhotos` guards in Part A only ever check existence). */
interface JourneyEntryPhotosExistsKyselyDB {
  journey_entry_photos: { entry_id: number };
}

/** JG64's narrow `journeyStats` projection — NOT the same text as JG14/JG71 (a wider `SELECT *`); a distinct, narrower column list read directly off the current source, not the inventory's (stale) "same text as JG14" annotation. */
export interface StatsEntryRow {
  id: number;
  title: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  entry_date: string | null;
  source_trip_id: number | null;
  source_place_id: number | null;
  stats_excluded: number;
}

/** JG65's per-trip stats row (`journeyStats`). */
export interface StatsTripRow {
  id: number;
  title: string | null;
  start: string | null;
  end: string | null;
}

/** JG66's per-place stats row (`journeyStats`), one row per place at its earliest day. */
export interface StatsPlaceRow {
  id: number;
  name: string | null;
  lat: number | null;
  lng: number | null;
  tripId: number | null;
  day: string | null;
  ord: number | null;
}

/** JG120/JG121's trip-picker row (`getSuggestions`/`listUserTrips`), the place-count-annotated trip summary. */
export interface TripPickerRow {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  place_count: number;
}

/** The narrow `journey_entries`/`journey_trips`/`trips`/`places`/`day_assignments`/`days` shape `journeyStats`'s cross-domain reads (JG65-67) need. */
interface StatsKyselyDB {
  journey_trips: { journey_id: number; trip_id: number };
  trips: { id: number; title: string | null; start_date: string | null; end_date: string | null };
  places: { id: number; trip_id: number; name: string | null; lat: number | null; lng: number | null };
  day_assignments: { id: number; place_id: number; day_id: number; order_index: number | null };
  days: { id: number; date: string | null };
}

/** JG70's chunked cached-country probe (`journeyStats`, `place_regions` — atlas-owned, 3f-DONE, read-only here). */
interface PlaceRegionsKyselyDB {
  place_regions: { place_id: number; country_code: string | null };
}

/** The narrow `trips`/`trip_members`/`places`/`day_assignments`/`journey_trips` shape JG120/JG121's trip-picker reads need. */
interface TripPickerKyselyDB {
  trips: { id: number; title: string; start_date: string | null; end_date: string | null; cover_image: string | null; user_id: number };
  trip_members: { trip_id: number; user_id: number };
  places: { id: number; trip_id: number };
  day_assignments: { id: number; place_id: number };
  journey_trips: { trip_id: number };
}

/**
 * `journey_entries` — first cut (Plan 3g Task 1, R9's Part A): every
 * insert/find/update/delete the sync engine (`syncTripPlaces`/
 * `onPlaceCreated`/`onPlaceUpdated`/`onPlaceDeleted`/`reconcileTripSkeletons`)
 * and `getJourneyFull`/`journeyTracks` need. Task 2 completes this file with
 * the entries-CRUD/photos-surface methods (JG64-116) its own Part B owns.
 */
export class JourneyEntriesRepository extends TrekRepository<JourneyEntries> {
  /** JG14 — `getJourneyFull`'s entries read: `SELECT * FROM journey_entries WHERE journey_id = ? AND dismissed = 0 ORDER BY entry_date ASC, sort_order ASC, id ASC` (same text as Task 2's own JG64/JG71). */
  async listForJourney(journeyId: number): Promise<JourneyEntry[]> {
    return await this.qb('je')
      .select(['je.*'])
      .where({ journey: journeyId, dismissed: 0 })
      .orderBy({ entry_date: 'asc', sort_order: 'asc', id: 'asc' })
      .execute<JourneyEntry[]>('all', false);
  }

  /**
   * JS13 (Plan 4 Task 8b relocation) — the public `getPublicJourney` route's
   * entry list: `SELECT je.* FROM journey_entries je WHERE je.journey_id=?
   * AND je.type != 'skeleton' AND je.dismissed=0 AND je.is_draft=0 (#696, a draft
   * stays off the share link) ORDER BY je.entry_date,
   * je.sort_order`. A narrower filter than {@link listForJourney}/JG14 (adds
   * the `type != 'skeleton'` exclusion — skeletons never appear publicly —
   * and has no `id` ORDER BY tiebreak), so this is a distinct method, not a
   * call to {@link listForJourney}. Previously lived as
   * `JourneyShareTokens.repository.ts`'s own fallback stub from 3g Task 3
   * (this repository was still mid-flight when that task landed) —
   * relocated here now that it is stable.
   */
  async listPublicEntries(journeyId: number): Promise<JourneyEntry[]> {
    return await this.qb('je')
      .select(['je.*'])
      .where({ journey: journeyId, type: { $ne: 'skeleton' }, dismissed: 0, is_draft: 0 })
      .orderBy({ entry_date: 'asc', sort_order: 'asc' })
      .execute<JourneyEntry[]>('all', false);
  }

  /** JG22 — `getJourneyFull`'s `dismissed_count`: `SELECT COUNT(*) AS n FROM journey_entries WHERE journey_id = ? AND dismissed = 1`. */
  async countDismissed(journeyId: number): Promise<number> {
    return await this.count({ journey: journeyId, dismissed: 1 });
  }

  /** JG28 — `restoreDismissedSuggestions`: `UPDATE journey_entries SET dismissed = 0 WHERE journey_id = ? AND dismissed = 1`. Returns the affected-row count (the SERVICE broadcasts only when it is > 0, unchanged). */
  async restoreDismissed(journeyId: number): Promise<number> {
    return await this.nativeUpdate({ journey: journeyId, dismissed: 1 }, { dismissed: 0 });
  }

  /** JG31 — `removeTripFromJourney`'s unfilled-skeleton cleanup: `DELETE FROM journey_entries WHERE journey_id = ? AND source_trip_id = ? AND type = 'skeleton'`. */
  async deleteSkeletonsForTrip(journeyId: number, tripId: number): Promise<void> {
    await this.nativeDelete({ journey: journeyId, sourceTrip: tripId, type: 'skeleton' });
  }

  /** JG32 — `removeTripFromJourney`'s filled-entry detach: content kept, `source_*` columns cleared. */
  async detachFilledForTrip(journeyId: number, tripId: number): Promise<void> {
    await this.nativeUpdate(
      { journey: journeyId, sourceTrip: tripId, type: { $ne: 'skeleton' } },
      { sourcePlace: null, sourceTrip: null, source_assignment_id: null },
    );
  }

  /**
   * TP32 (Plan 3g Task 4 survivor, `TripsService.remove`) — `DELETE FROM
   * journey_entries WHERE source_trip_id = ? AND type = 'skeleton'`. NO
   * `journey_id` scope, unlike {@link deleteSkeletonsForTrip}/JG31 — a trip
   * delete drops every skeleton synced from it across every journey it was
   * ever linked to, not just one. A genuinely different statement text, not
   * a call to {@link deleteSkeletonsForTrip}.
   */
  async deleteAllSkeletonsForTrip(tripId: number): Promise<void> {
    await this.nativeDelete({ sourceTrip: tripId, type: 'skeleton' });
  }

  /**
   * TP33 (Plan 3g Task 4 survivor, `TripsService.remove`) — `UPDATE
   * journey_entries SET source_trip_id=NULL, source_place_id=NULL,
   * source_assignment_id=NULL WHERE source_trip_id = ?`. NO `journey_id`
   * scope AND no `type != 'skeleton'` filter, unlike {@link
   * detachFilledForTrip}/JG32 — by the time this runs, {@link
   * deleteAllSkeletonsForTrip}/TP32 has already removed every skeleton row
   * with this `source_trip_id` (same transaction, called first in
   * `TripsService.remove`), so every row this statement can still match is
   * already non-skeleton; the missing filter is preserved exactly, not
   * "fixed" into a redundant one.
   */
  async detachAllFilledForTrip(tripId: number): Promise<void> {
    await this.nativeUpdate({ sourceTrip: tripId }, { sourcePlace: null, sourceTrip: null, source_assignment_id: null });
  }

  /**
   * UC9 (Plan 3g Task 4 survivor, `UserCleanupService.cleanupUserReferences`)
   * — `DELETE FROM journey_entries WHERE author_id = ?`: entries this user
   * authored on OTHER users' journeys (not covered by UC8's cascade, since
   * those journeys aren't owned by the departing user).
   */
  async deleteByAuthorId(userId: number): Promise<void> {
    await this.nativeDelete({ author: userId });
  }

  /** JG35 — `syncTripPlaces`'s existing-skeleton dedup-key read: `SELECT source_place_id, source_assignment_id FROM journey_entries WHERE journey_id = ? AND source_trip_id = ?`. */
  async listSourceKeysForTrip(journeyId: number, tripId: number): Promise<{ source_place_id: number; source_assignment_id: number | null }[]> {
    return await this.qb('je')
      .select(['je.sourcePlace', 'je.source_assignment_id'])
      .where({ journey: journeyId, sourceTrip: tripId })
      .execute<{ source_place_id: number; source_assignment_id: number | null }[]>('all', false);
  }

  /** JG36/JG56 — the per-date next-`sort_order` map: `SELECT entry_date, COALESCE(MAX(sort_order), -1) AS m FROM journey_entries WHERE journey_id = ? GROUP BY entry_date`. */
  async dateSortOrderMaxima(journeyId: number): Promise<{ entry_date: string; m: number }[]> {
    const rows = await this.kysely<JourneyEntriesDateSortKyselyDB>()
      .selectFrom('journey_entries')
      .select(['entry_date', (eb) => eb.fn.coalesce(eb.fn.max('sort_order'), eb.val<number>(-1)).as('m')])
      .where('journey_id', '=', journeyId)
      .groupBy('entry_date')
      .execute();
    return rows as { entry_date: string; m: number }[];
  }

  /** JG42 — `onPlaceCreated`'s next-order lookup: `SELECT MAX(sort_order) AS m FROM journey_entries WHERE journey_id = ? AND entry_date = ?`. The `?? -1` fallback stays the SERVICE's, unchanged (same text as Task 2's own JG74). */
  async maxSortOrderForDate(journeyId: number, entryDate: string): Promise<number | null> {
    const row = await this.kysely<JourneyEntriesDateSortKyselyDB>()
      .selectFrom('journey_entries')
      .select((eb) => eb.fn.max<number | null>('sort_order').as('m'))
      .where('journey_id', '=', journeyId)
      .where('entry_date', '=', entryDate)
      .executeTakeFirst();
    // Plan 4 Task 8b: `row?.` is unreachable — an unqualified, ungrouped
    // `MAX(...)` always returns exactly one row (NULL `m` when nothing
    // matches, never zero rows), so `executeTakeFirst()` can't actually miss
    // here. Kept for type-shape symmetry with `executeTakeFirst()`'s
    // `| undefined` return type (same accepted class as `OauthClients:147`
    // — see that file's own docstring for the precedent), not dead by
    // mistake. `row.m` itself genuinely can be `null` (no matching rows),
    // so the `?? null` is real, not defensive filler.
    return row?.m ?? null;
  }

  /** JG37 — `insertSkeletonEntry`'s shared write, called from `syncTripPlaces`/`onPlaceCreated`/`reconcileTripSkeletons`. `country_code` is resolved by the SERVICE's `countryFor` (pure JS, not SQL) before this call. */
  async insertSkeleton(data: {
    journey_id: number;
    source_trip_id: number;
    source_place_id: number;
    source_assignment_id: number | null;
    author_id: number;
    title: string;
    entry_date: string;
    entry_time: string | null;
    location_name: string;
    location_lat: number | null;
    location_lng: number | null;
    country_code: string | null;
    sort_order: number;
    created_at: number;
    updated_at: number;
  }): Promise<number> {
    return await this.insert({
      journey: data.journey_id,
      sourceTrip: data.source_trip_id,
      sourcePlace: data.source_place_id,
      source_assignment_id: data.source_assignment_id,
      author: data.author_id,
      type: 'skeleton',
      title: data.title,
      entry_date: data.entry_date,
      entry_time: data.entry_time,
      location_name: data.location_name,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      country_code: data.country_code,
      sort_order: data.sort_order,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  /** JG41 — `onPlaceCreated`'s per-assignment dedup guard: `SELECT 1 FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND source_assignment_id IS ?` — NULL-safe, an unassigned skeleton matches a `null` `assignmentId` the same way. */
  async existsForPlaceAssignment(journeyId: number, placeId: number, assignmentId: number | null): Promise<boolean> {
    const row = await this.qb('je')
      .select(['je.id'])
      .where({ journey: journeyId, sourcePlace: placeId, source_assignment_id: assignmentId })
      .execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /** JG43/JG48 — `onPlaceUpdated`/`onPlaceDeleted`: `SELECT * FROM journey_entries WHERE source_place_id = ?`, one statement text. */
  async listBySourcePlace(placeId: number): Promise<JourneyEntry[]> {
    return await this.qb('je').select(['je.*']).where({ sourcePlace: placeId }).execute<JourneyEntry[]>('all', false);
  }

  /** JG46/JG58 — the full skeleton snapshot refresh (`onPlaceUpdated`'s skeleton branch, `reconcileTripSkeletons`'s stale-skeleton branch), one statement text. */
  async updateSkeletonSnapshot(
    id: number,
    patch: {
      title: string;
      entry_date: string;
      entry_time: string | null;
      location_name: string;
      location_lat: number | null;
      location_lng: number | null;
      country_code: string | null;
      updated_at: number;
    },
  ): Promise<void> {
    await this.nativeUpdate({ id }, patch);
  }

  /** JG47/JG59 — the location-only silent update (`onPlaceUpdated`'s filled-entry branch, `reconcileTripSkeletons`'s stale-filled-entry branch), one statement text. */
  async updateLocationOnly(
    id: number,
    patch: { location_name: string; location_lat: number | null; location_lng: number | null; country_code: string | null; updated_at: number },
  ): Promise<void> {
    await this.nativeUpdate({ id }, patch);
  }

  /** JG50/JG61/JG86 — the true hard delete (`onPlaceDeleted`'s no-content skeleton branch, `reconcileTripSkeletons`'s gone-assignment branch, Task 2's own `deleteEntry` else-branch), one statement text. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** JG51/JG62 — the detach-and-annotate write (`onPlaceDeleted`'s has-content branch, `reconcileTripSkeletons`'s gone-assignment-with-content branch), one statement text. */
  async detachAndAnnotate(id: number, patch: { type: string; story: string; updated_at: number }): Promise<void> {
    await this.nativeUpdate({ id }, { sourcePlace: null, sourceTrip: null, source_assignment_id: null, ...patch });
  }

  /** JG55 — `reconcileTripSkeletons`'s own wider read (a DIFFERENT column set from JG35 — not a dup). */
  async listForTripReconcile(journeyId: number, tripId: number): Promise<ReconcileEntryRow[]> {
    const rows = await this.qb('je')
      .select([
        'je.id',
        'je.sourcePlace',
        'je.source_assignment_id',
        'je.type',
        'je.story',
        'je.title',
        'je.entry_date',
        'je.entry_time',
        'je.location_name',
        'je.location_lat',
        'je.location_lng',
      ])
      .where({ journey: journeyId, sourceTrip: tripId })
      .execute<unknown[]>('all', false);
    return rows as ReconcileEntryRow[];
  }

  /** JG57 — `reconcileTripSkeletons`'s adoption branch: `UPDATE journey_entries SET source_assignment_id = ? WHERE id = ?`, claiming an unclaimed pre-assignment-link row. */
  async claimAssignment(id: number, assignmentId: number | null): Promise<void> {
    await this.nativeUpdate({ id }, { source_assignment_id: assignmentId });
  }

  /** JG49/JG60 — the `hasPhotos` guard (`onPlaceDeleted`, `reconcileTripSkeletons`) against `journey_entry_photos`, cross-table (Task 2 owns `JourneyEntryPhotosRepository` itself). */
  async existsPhotoForEntry(entryId: number): Promise<boolean> {
    const row = await this.kysely<JourneyEntryPhotosExistsKyselyDB>()
      .selectFrom('journey_entry_photos')
      .select('entry_id')
      .where('entry_id', '=', entryId)
      .executeTakeFirst();
    return !!row;
  }

  // ── Plan 3g Task 2 (Part B) — appended-only below this line. Every method
  // above this belongs to Task 1 (Part A) and is untouched by this task. ──

  /**
   * JG64 — `journeyStats`'s own entries read. Read directly off the current
   * source rather than the inventory's "same text as JG14" annotation,
   * which is stale at HEAD: the actual statement is a NARROWER, distinct
   * column list (`id, title, location_name, location_lat, location_lng,
   * entry_date, source_trip_id, source_place_id, stats_excluded`), not
   * `SELECT *`. `stats_excluded` stays a plain column projection — filtered
   * in the SERVICE, never the WHERE clause (plan3g-inputs.md correction #3:
   * the caller needs the excluded rows too, for the response's `excluded`
   * field).
   */
  async listStatsRows(journeyId: number): Promise<StatsEntryRow[]> {
    return await this.qb('je')
      .select(['je.id', 'je.title', 'je.location_name', 'je.location_lat', 'je.location_lng', 'je.entry_date', 'je.sourceTrip', 'je.sourcePlace', 'je.stats_excluded'])
      .where({ journey: journeyId, dismissed: 0 })
      .orderBy({ entry_date: 'asc', sort_order: 'asc', id: 'asc' })
      .execute<StatsEntryRow[]>('all', false);
  }

  /**
   * JG65 — `journeyStats`'s per-trip read, undated trips sorted last (the
   * `start_date IS NULL` ordering trick, recomputed as its own ORDER BY
   * expression rather than referencing the SELECT list's own alias — Kysely
   * has no typed "order by select alias" form, and recomputing the same
   * `t.start_date`/`t.id` references is equivalent SQL). Housed on this
   * repository (not `JourneyTripsRepository`, Task 1's own file, outside
   * this task's named file set) the same way `JourneyTripsRepository`
   * itself reaches `places`/`day_assignments`/`days` for the sync engine —
   * a repository may query any table over `this.kysely()`.
   */
  async listStatsTrips(journeyId: number): Promise<StatsTripRow[]> {
    const rows = await this.kysely<StatsKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('trips as t', 't.id', 'jt.trip_id')
      .select(['t.id', 't.title', 't.start_date as start', 't.end_date as end'])
      .where('jt.journey_id', '=', journeyId)
      .orderBy((eb) => eb('t.start_date', 'is', null), 'asc')
      .orderBy('t.start_date', 'asc')
      .orderBy('t.id', 'asc')
      .execute();
    return rows as StatsTripRow[];
  }

  /**
   * JG66 — `journeyStats`'s per-place read: one row per place at its
   * earliest day (`GROUP BY p.id`, aggregated so a hotel spanning several
   * nights' assignments counts once, not once per night).
   */
  async listStatsPlaces(journeyId: number): Promise<StatsPlaceRow[]> {
    const rows = await this.kysely<StatsKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('places as p', 'p.trip_id', 'jt.trip_id')
      .leftJoin('day_assignments as da', 'da.place_id', 'p.id')
      .leftJoin('days as d', 'd.id', 'da.day_id')
      .select((eb) => ['p.id', 'p.name', 'p.lat', 'p.lng', 'p.trip_id as tripId', eb.fn.min<string | null>('d.date').as('day'), eb.fn.min<number | null>('da.order_index').as('ord')])
      .where('jt.journey_id', '=', journeyId)
      .groupBy('p.id')
      .orderBy((eb) => eb(eb.fn.min<string | null>('d.date'), 'is', null), 'asc')
      .orderBy((eb) => eb.fn.min('d.date'), 'asc')
      .orderBy((eb) => eb.fn.min('da.order_index'), 'asc')
      .orderBy('p.id', 'asc')
      .execute();
    return rows as StatsPlaceRow[];
  }

  /** JG67 — `journeyStats`'s place count: `SELECT COUNT(*) AS n FROM journey_trips jt JOIN places p ON p.trip_id=jt.trip_id WHERE jt.journey_id=?`. */
  async countStatsPlaces(journeyId: number): Promise<number> {
    const row = await this.kysely<StatsKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('places as p', 'p.trip_id', 'jt.trip_id')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('jt.journey_id', '=', journeyId)
      .executeTakeFirst();
    // Plan 4 Task 8b: both `row?.` AND `?? 0` are unreachable here — an
    // unqualified, ungrouped `COUNT(*)` always returns exactly one row, and
    // `COUNT` itself never returns `NULL` (zero matches is a real `0`, not
    // an absent row). Kept for type-shape symmetry with `executeTakeFirst()`
    // `| undefined` return type, same accepted class as `OauthClients:147`.
    return row?.n ?? 0;
  }

  /**
   * JG70 — `journeyStats`'s cached-country probe, chunked in groups of 400
   * (SQLite's bound-variable-count limit is why it's chunked at all — do
   * not collapse into one unchunked `IN`). Returns every matching row
   * unfiltered (including a null/empty `country_code`) — the `if
   * (r.country_code)` filter and the `.toUpperCase()` call both stay in the
   * SERVICE, matching the legacy code's own JS-side handling.
   */
  async listCachedCountriesForPlaceIds(placeIds: number[]): Promise<{ place_id: number; country_code: string | null }[]> {
    const out: { place_id: number; country_code: string | null }[] = [];
    for (let i = 0; i < placeIds.length; i += 400) {
      // M4 (task-5-review.md) — `chunk` can never be empty here: the loop
      // guard `i < placeIds.length` guarantees at least one element remains
      // to slice, so a dead `if (!chunk.length) continue;` used to sit here
      // (an uncovered branch the coverage gate flagged, worse than base).
      const chunk = placeIds.slice(i, i + 400);
      const rows = await this.kysely<PlaceRegionsKyselyDB>()
        .selectFrom('place_regions')
        .select(['place_id', 'country_code'])
        .where('place_id', 'in', chunk)
        .execute();
      out.push(...rows);
    }
    return out;
  }

  /** JG76/JG77/JG80/JG84/JG94/JG95/JG97/JG103 — `SELECT * FROM journey_entries WHERE id = ?`, the widest dup group in this file. */
  async findById(id: number): Promise<JourneyEntry | null> {
    const row = await this.qb('je').select(['je.*']).where({ id }).execute<JourneyEntry | undefined>('get', false);
    return row ?? null;
  }

  /** JG75 — `createEntry`'s INSERT (20 columns, `is_draft` since #696). `country_code` is resolved by the SERVICE's `countryFor` before this call, matching {@link insertSkeleton}'s own contract. */
  async insertEntry(data: {
    journey_id: number;
    author_id: number;
    type: string;
    title: string | null;
    story: string | null;
    entry_date: string;
    entry_time: string | null;
    location_name: string | null;
    location_lat: number | null;
    location_lng: number | null;
    country_code: string | null;
    mood: string | null;
    weather: string | null;
    tags: string | null;
    pros_cons: string | null;
    visibility: string;
    sort_order: number;
    is_draft: number;
    created_at: number;
    updated_at: number;
  }): Promise<number> {
    return await this.insert({
      journey: data.journey_id,
      author: data.author_id,
      type: data.type,
      title: data.title,
      story: data.story,
      entry_date: data.entry_date,
      entry_time: data.entry_time,
      location_name: data.location_name,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      country_code: data.country_code,
      mood: data.mood,
      weather: data.weather,
      tags: data.tags,
      pros_cons: data.pros_cons,
      visibility: data.visibility,
      sort_order: data.sort_order,
      is_draft: data.is_draft,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  /**
   * JG78 — `updateEntry`'s dynamic UPDATE (R6, `presenceSet`). The SERVICE
   * resolves every field to its final bound value first (`tags`/`pros_cons`
   * JSON-encoded, `stats_excluded`/`dismissed`/`is_draft` boolean-coerced to 0/1,
   * `country_code` recomputed whenever either `location_lat`/`location_lng`
   * is present in the patch, the skeleton→entry promotion) — this writes
   * exactly the patch it is handed, same contract every other
   * `presenceSet`-fed repository method in this program follows.
   */
  async updateFields(
    id: number,
    patch: Partial<{
      type: string;
      title: string | null;
      story: string | null;
      entry_date: string;
      entry_time: string | null;
      location_name: string | null;
      location_lat: number | null;
      location_lng: number | null;
      mood: string | null;
      weather: string | null;
      tags: string | null;
      pros_cons: string | null;
      visibility: string;
      sort_order: number;
      stats_excluded: number;
      dismissed: number;
      is_draft: number;
      country_code: string | null;
      updated_at: number;
    }>,
  ): Promise<void> {
    await this.nativeUpdate({ id }, patch);
  }

  /** JG81 — `reorderEntries`'s ownership-verification read: `SELECT id FROM journey_entries WHERE id IN (${placeholders}) AND journey_id = ?`. */
  async listIdsIn(journeyId: number, ids: number[]): Promise<number[]> {
    const rows = await this.qb('je')
      .select(['je.id'])
      .where({ id: { $in: ids }, journey: journeyId })
      .execute<{ id: number }[]>('all', false);
    return rows.map((r) => r.id);
  }

  /**
   * JG82 — `reorderEntries`'s per-id sort_order write, called in a loop
   * inside the SERVICE's own `uow.transactional` block (the legacy
   * statement prepared once and reused across the loop; this program's
   * repository layer has no direct "one prepared statement, many binds"
   * equivalent, so a `nativeUpdate` call per id is the accepted substitute
   * per the task brief — still one write per id, still inside the SAME
   * transaction, still in the caller's own `orderedIds` array order).
   */
  async updateSortOrder(id: number, sortOrder: number, updatedAt: number): Promise<void> {
    await this.nativeUpdate({ id }, { sort_order: sortOrder, updated_at: updatedAt });
  }

  /** JG85 — `deleteEntry`'s revert-to-skeleton write (a filled, trip-sourced entry is "deleted" by reverting it, not removed — {@link deleteById} (JG50/61/86) is the true hard delete, for entries with no trip origin). */
  async revertToSkeleton(id: number, updatedAt: number): Promise<void> {
    await this.nativeUpdate({ id }, { type: 'skeleton', story: null, mood: null, weather: null, pros_cons: null, visibility: 'private', updated_at: updatedAt });
  }

  /** JG87 — `promoteSkeletonIfNeeded`'s write: `UPDATE journey_entries SET type = ?, updated_at = ? WHERE id = ?`, called only when the entry is still a skeleton (the SERVICE's own `if (entry.type !== 'skeleton') return;` guard, unchanged). */
  async markAsEntry(id: number, updatedAt: number): Promise<void> {
    await this.nativeUpdate({ id }, { type: 'entry', updated_at: updatedAt });
  }

  /**
   * JG120 — `getSuggestions`'s trip-picker read: recently-ended trips not
   * yet linked to any journey. `date('now')` is resolved in the SERVICE via
   * `todayUtc()` (`@trek/shared`) and bound as a plain parameter, the SAME
   * pattern Plan 3f's atlas conversion already established for a bare
   * `date('now')` comparison (`Trips.repository.ts#lastStartedTrip`'s own
   * docstring) — no new dialect helper. Housed here for the same
   * cross-domain-reach-via-`this.kysely()` reason as {@link listStatsTrips}
   * above (`TripsRepository`/`JourneyTripsRepository` are both outside this
   * task's named file set).
   */
  async listSuggestedTrips(userId: number, since: string, today: string): Promise<TripPickerRow[]> {
    const rows = await this.kysely<TripPickerKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('trip_members as tm', (join) => join.onRef('tm.trip_id', '=', 't.id').on('tm.user_id', '=', userId))
      .select((eb) => [
        't.id',
        't.title',
        't.start_date',
        't.end_date',
        't.cover_image',
        eb
          .selectFrom('places as p')
          .innerJoin('day_assignments as da', 'da.place_id', 'p.id')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('p.trip_id', '=', 't.id')
          .as('place_count'),
      ])
      .where((eb) => eb.or([eb('t.user_id', '=', userId), eb('tm.user_id', '=', userId)]))
      .where('t.end_date', 'is not', null)
      .where('t.end_date', '>=', since)
      .where('t.end_date', '<=', today)
      .where((eb) => eb('t.id', 'not in', eb.selectFrom('journey_trips').select('trip_id')))
      .orderBy('t.end_date', 'desc')
      .execute();
    return rows as TripPickerRow[];
  }

  /** JG121 — `listUserTrips`'s trip-picker source list: every trip the caller owns or is a member of, place-count-annotated, no date filter (unlike JG120). */
  async listUserTripsPicker(userId: number): Promise<TripPickerRow[]> {
    const rows = await this.kysely<TripPickerKyselyDB>()
      .selectFrom('trips as t')
      .leftJoin('trip_members as tm', (join) => join.onRef('tm.trip_id', '=', 't.id').on('tm.user_id', '=', userId))
      .select((eb) => [
        't.id',
        't.title',
        't.start_date',
        't.end_date',
        't.cover_image',
        eb
          .selectFrom('places as p')
          .innerJoin('day_assignments as da', 'da.place_id', 'p.id')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('p.trip_id', '=', 't.id')
          .as('place_count'),
      ])
      .where((eb) => eb.or([eb('t.user_id', '=', userId), eb('tm.user_id', '=', userId)]))
      .orderBy('t.start_date', 'desc')
      .execute();
    return rows as TripPickerRow[];
  }

  /** JG63 — `journeyTracks`: every place with route geometry belonging to a trip this journey's entries reference. */
  async listTracksSource(journeyId: number): Promise<JourneyTrackSourceRow[]> {
    const rows = await this.kysely<JourneyTracksKyselyDB>()
      .selectFrom('journey_entries as je')
      .innerJoin('places as p', 'p.trip_id', 'je.source_trip_id')
      .select(['p.id as place_id', 'p.trip_id', 'p.name', 'p.route_color', 'p.route_geometry'])
      .distinct()
      .where('je.journey_id', '=', journeyId)
      .where('je.source_trip_id', 'is not', null)
      .where('p.route_geometry', 'is not', null)
      .orderBy('p.trip_id', 'asc')
      .orderBy('p.id', 'asc')
      .execute();
    return rows as JourneyTrackSourceRow[];
  }

  /**
   * JG122 — `placeEntriesFromPhotos`'s candidate read (#1003): entries without a
   * place that hold one of these geotagged photos, on journeys that opted in.
   * `SELECT je.id AS entryId, je.journey_id AS journeyId, tp.lat, tp.lng FROM trek_photos tp
   * JOIN journey_photos gp ON gp.photo_id = tp.id JOIN journey_entry_photos jep ON jep.journey_photo_id = gp.id
   * JOIN journey_entries je ON je.id = jep.entry_id JOIN journeys j ON j.id = je.journey_id
   * WHERE tp.id IN (…) AND tp.lat IS NOT NULL AND tp.lng IS NOT NULL AND je.location_lat IS NULL
   * AND je.location_lng IS NULL AND je.type != 'skeleton' AND j.photo_location = 1
   * ORDER BY je.id, jep.sort_order, jep.journey_photo_id`. The SERVICE keeps the first row per entry.
   */
  async listPhotoPlacementCandidates(trekPhotoIds: number[]): Promise<PhotoPlacementRow[]> {
    if (!trekPhotoIds.length) return [];
    const rows = await this.kysely<PhotoPlacementKyselyDB>()
      .selectFrom('trek_photos as tp')
      .innerJoin('journey_photos as gp', 'gp.photo_id', 'tp.id')
      .innerJoin('journey_entry_photos as jep', 'jep.journey_photo_id', 'gp.id')
      .innerJoin('journey_entries as je', 'je.id', 'jep.entry_id')
      .innerJoin('journeys as j', 'j.id', 'je.journey_id')
      .select(['je.id as entryId', 'je.journey_id as journeyId', 'tp.lat', 'tp.lng'])
      .where('tp.id', 'in', trekPhotoIds)
      .where('tp.lat', 'is not', null)
      .where('tp.lng', 'is not', null)
      .where('je.location_lat', 'is', null)
      .where('je.location_lng', 'is', null)
      .where('je.type', '!=', 'skeleton')
      .where('j.photo_location', '=', 1)
      .orderBy('je.id')
      .orderBy('jep.sort_order')
      .orderBy('jep.journey_photo_id')
      .execute();
    return rows as PhotoPlacementRow[];
  }

  /**
   * JG123 — `placeEntriesFromPhotos`'s write: `UPDATE journey_entries SET location_lat = ?,
   * location_lng = ?, country_code = ?, updated_at = ? WHERE id = ? AND location_lat IS NULL
   * AND location_lng IS NULL`. Answers the affected-row count: an entry placed in the
   * meantime is never moved, and the SERVICE only reports the ones that changed.
   */
  async placeIfUnplaced(
    id: number,
    patch: { location_lat: number; location_lng: number; country_code: string | null; updated_at: number },
  ): Promise<number> {
    return await this.nativeUpdate({ id, location_lat: null, location_lng: null }, patch);
  }

  /**
   * JG124 — `nameEntryLocation`: `UPDATE journey_entries SET location_name = ? WHERE id = ?
   * AND (location_name IS NULL OR location_name = '')`.
   */
  async nameLocationIfUnnamed(id: number, location_name: string): Promise<void> {
    await this.nativeUpdate({ id, $or: [{ location_name: null }, { location_name: '' }] }, { location_name });
  }
}
