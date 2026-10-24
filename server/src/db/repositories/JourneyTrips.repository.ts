import type { JourneyTrips } from '../entities/JourneyTrips.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** JG17's trip-link row (`getJourneyFull`) — the junction plus the joined trip summary and its place count. */
export interface JourneyTripLinkRow {
  trip_id: number;
  added_at: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  currency: string | null;
  place_count: number;
}

/** The `journey_trips`/`trips`/`places` tables {@link JourneyTripsRepository.listForJourney} reads. */
type JourneyTripLinkKyselyDB = Pick<DB, 'journey_trips' | 'trips' | 'places'>;

/**
 * The sync engine's per-assignment place row (JG34/onPlaceCreated's JG39,
 * unified — see {@link JourneyTripsRepository.listAssignedPlacesForTrip}'s
 * docstring). Only the columns `syncTripPlaces`/`onPlaceCreated`/
 * `reconcileTripSkeletons` actually read — `place.*`'s other physical columns
 * (`category_id`, `price`, `notes`, …) are never touched by the sync engine
 * and are left out of this projection rather than hand-copied for parity
 * with no consumer.
 */
export interface SyncAssignedPlaceRow {
  id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_time: string | null;
  assignment_id: number;
  day_date: string | null;
  assignment_time: string | null;
}

/** JG45's per-assignment-only row (`onPlaceUpdated`, no `places` join — the place itself is already in hand). */
export interface AssignmentTimeRow {
  assignment_id: number;
  day_date: string | null;
  assignment_time: string | null;
}

/** The `places`/`day_assignments`/`days` tables the sync-engine reads read. */
type SyncPlacesKyselyDB = Pick<DB, 'places' | 'day_assignments' | 'days'>;

/** One day a linked trip's plan puts a located place on (JRN-04), {@link JourneyTripsRepository.listMapPlacesForJourney}. */
interface JourneyMapPlaceRow {
  place_id: number;
  trip_id: number;
  trip_title: string;
  name: string;
  lat: number;
  lng: number;
  day_date: string | null;
  time: string | null;
  category_color: string | null;
  category_icon: string | null;
}

/** A place of a linked trip that carries a route (JRN-04), {@link JourneyTripsRepository.listRouteSourcesForJourney}. */
interface JourneyRouteSourceRow {
  place_id: number;
  trip_id: number;
  name: string;
  route_color: string | null;
  route_geometry: string;
}

/** The tables the journey map's plan reads join. */
type JourneyMapKyselyDB = Pick<DB, 'journey_trips' | 'trips' | 'places' | 'day_assignments' | 'days' | 'categories'>;

/**
 * `journey_trips` — a genuine TWO-column composite primary key (`journey` +
 * `trip`, both `.primary()`, R3 — pinned against
 * `Migration20200101013300_journey_rebuild.ts:19-25`'s
 * `PRIMARY KEY (journey_id, trip_id)` by Task 0). Also carries the sync
 * engine's cross-domain reads over `places`/`day_assignments`/`days` (3c,
 * already populated) — those three tables have their own repositories
 * elsewhere in the program, but a repository may query any table over
 * `this.kysely()` (`TripsRepository.tripSelectQuery`'s own precedent, joining
 * `users`/`days`/`places`/`trip_members`), so the sync engine's reads land
 * here rather than editing `Places.repository.ts`/`DayAssignments.repository.ts`
 * (both outside this task's named file set).
 */
export class JourneyTripsRepository extends TrekRepository<JourneyTrips> {
  /** JG38/JG52 — `onPlaceCreated`/`reconcileTripSkeletons`: `SELECT journey_id FROM journey_trips WHERE trip_id = ?`, one statement text. */
  async listJourneyIdsForTrip(tripId: number): Promise<number[]> {
    const rows = await this.qb('jt')
      .select(['jt.journey'])
      .where({ trip: tripId })
      .execute<{ journey_id: number }[]>('all', false);
    return rows.map((r) => r.journey_id);
  }

  /** JG17 — `getJourneyFull`'s linked-trips read, joined to `trips` with a per-trip place-count subquery. */
  async listForJourney(journeyId: number): Promise<JourneyTripLinkRow[]> {
    const rows = await this.kysely<JourneyTripLinkKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('trips as t', 't.id', 'jt.trip_id')
      .select((eb) => [
        'jt.trip_id',
        'jt.added_at',
        't.title',
        't.start_date',
        't.end_date',
        't.cover_image',
        't.currency',
        eb
          .selectFrom('places as p')
          .select((eb2) => eb2.fn.countAll<number>().as('c'))
          .whereRef('p.trip_id', '=', 't.id')
          .as('place_count'),
      ])
      .where('jt.journey_id', '=', journeyId)
      .orderBy('t.start_date', 'asc')
      .execute();
    return rows as JourneyTripLinkRow[];
  }

  /** JG30 — `addTripToJourney`: `INSERT OR IGNORE INTO journey_trips (journey_id, trip_id, added_at) VALUES (?, ?, ?)`, the composite-PK conflict target. */
  async insertIgnore(journeyId: number, tripId: number, addedAt: number): Promise<void> {
    await this.upsert(
      { journey: journeyId, trip: tripId, added_at: addedAt },
      { onConflictFields: ['journey', 'trip'], onConflictAction: 'ignore' },
    );
  }

  /** JG33 — `removeTripFromJourney`: `DELETE FROM journey_trips WHERE journey_id = ? AND trip_id = ?`. */
  async deleteLink(journeyId: number, tripId: number): Promise<void> {
    await this.nativeDelete({ journey: journeyId, trip: tripId });
  }

  /**
   * JG34/JG53 — `syncTripPlaces`'s and `reconcileTripSkeletons`'s
   * per-assignment place read for a whole trip: every place currently
   * assigned to a day, one row per assignment (#2329 — a place on two days
   * is two rows). JG53's raw text differs from JG34's only in two columns
   * neither consumer's JS ever reads (`da.assignment_end_time` present in
   * JG34 only, `da.order_index` present in JG53 only, both selected purely
   * for the legacy statement's own `ORDER BY` — already reproduced below via
   * `.orderBy(...)`, never referenced downstream as a field) — collapsed
   * into ONE method both callers share rather than two byte-identical-outcome
   * copies.
   */
  async listAssignedPlacesForTrip(tripId: number): Promise<SyncAssignedPlaceRow[]> {
    const rows = await this.kysely<SyncPlacesKyselyDB>()
      .selectFrom('places as p')
      .innerJoin('day_assignments as da', 'da.place_id', 'p.id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select([
        'p.id',
        'p.name',
        'p.address',
        'p.lat',
        'p.lng',
        'p.place_time',
        'da.id as assignment_id',
        'd.date as day_date',
        'da.assignment_time',
      ])
      .where('p.trip_id', '=', tripId)
      .orderBy('d.day_number', 'asc')
      .orderBy('da.order_index', 'asc')
      .execute();
    return rows as SyncAssignedPlaceRow[];
  }

  /** JG39 — `onPlaceCreated`'s per-assignment read for ONE place (every day it now stands on, #2329). */
  async listAssignedPlacesForPlace(placeId: number): Promise<SyncAssignedPlaceRow[]> {
    const rows = await this.kysely<SyncPlacesKyselyDB>()
      .selectFrom('places as p')
      .innerJoin('day_assignments as da', 'da.place_id', 'p.id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select([
        'p.id',
        'p.name',
        'p.address',
        'p.lat',
        'p.lng',
        'p.place_time',
        'da.id as assignment_id',
        'd.date as day_date',
        'da.assignment_time',
      ])
      .where('p.id', '=', placeId)
      .orderBy('d.day_number', 'asc')
      .orderBy('da.order_index', 'asc')
      .execute();
    return rows as SyncAssignedPlaceRow[];
  }

  /** JG45 — `onPlaceUpdated`'s bare assignment-time read (no `places` join — the place row is already in hand). */
  async listAssignmentTimesForPlace(placeId: number): Promise<AssignmentTimeRow[]> {
    const rows = await this.kysely<SyncPlacesKyselyDB>()
      .selectFrom('day_assignments as da')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .select(['da.id as assignment_id', 'd.date as day_date', 'da.assignment_time'])
      .where('da.place_id', '=', placeId)
      .orderBy('d.day_number', 'asc')
      .orderBy('da.order_index', 'asc')
      .execute();
    return rows as AssignmentTimeRow[];
  }

  /**
   * The located places the linked trips plan on a day, one row per day they
   * stand on, in plan order (JRN-04). Through `journey_trips`, so a linked
   * trip nobody has written about yet still shows its plan; a place without
   * coordinates is left out rather than put anywhere.
   */
  async listMapPlacesForJourney(journeyId: number): Promise<JourneyMapPlaceRow[]> {
    const rows = await this.kysely<JourneyMapKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('trips as t', 't.id', 'jt.trip_id')
      .innerJoin('places as p', 'p.trip_id', 'jt.trip_id')
      .innerJoin('day_assignments as da', 'da.place_id', 'p.id')
      .innerJoin('days as d', 'd.id', 'da.day_id')
      .leftJoin('categories as c', 'c.id', 'p.category_id')
      .select([
        'p.id as place_id',
        'p.trip_id',
        't.title as trip_title',
        'p.name',
        'p.lat',
        'p.lng',
        'd.date as day_date',
        'da.assignment_time',
        'p.place_time',
        'c.color as category_color',
        'c.icon as category_icon',
      ])
      .where('jt.journey_id', '=', journeyId)
      .where('p.lat', 'is not', null)
      .where('p.lng', 'is not', null)
      .orderBy('t.start_date', 'asc')
      .orderBy('d.day_number', 'asc')
      .orderBy('da.order_index', 'asc')
      .execute();
    return rows.map((row) => ({
      place_id: row.place_id,
      trip_id: row.trip_id,
      trip_title: row.trip_title,
      name: row.name,
      lat: row.lat as number,
      lng: row.lng as number,
      day_date: row.day_date,
      time: row.assignment_time ?? row.place_time,
      category_color: row.category_color,
      category_icon: row.category_icon,
    }));
  }

  /**
   * The places of the linked trips that carry a route (JRN-04). Unlike the
   * entries' `listTracksSource`, which `/tracks` and Studio read and which
   * stays as it is, this goes through `journey_trips`.
   */
  async listRouteSourcesForJourney(journeyId: number): Promise<JourneyRouteSourceRow[]> {
    const rows = await this.kysely<JourneyMapKyselyDB>()
      .selectFrom('journey_trips as jt')
      .innerJoin('places as p', 'p.trip_id', 'jt.trip_id')
      .select(['p.id as place_id', 'p.trip_id', 'p.name', 'p.route_color', 'p.route_geometry'])
      .where('jt.journey_id', '=', journeyId)
      .where('p.route_geometry', 'is not', null)
      .orderBy('p.trip_id', 'asc')
      .orderBy('p.id', 'asc')
      .execute();
    return rows as JourneyRouteSourceRow[];
  }
}
