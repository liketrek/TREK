import { Injectable } from '@nestjs/common';
import type {
  PublicApiAccommodation,
  PublicApiBucketListItem,
  PublicApiDay,
  PublicApiDayNote,
  PublicApiInclude,
  PublicApiPlace,
  PublicApiReservation,
  PublicApiTraveller,
  PublicApiTrip,
  PublicApiTripSummary,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';

/**
 * Assembles the read-only public API payloads.
 *
 * Two rules run through everything here:
 *
 * 1. **Access is decided per trip, against the database, every time.** The list
 *    comes from `listAccessibleTripIds`, a single trip goes through
 *    `canAccessTrip` — the same predicates the rest of TREK uses (owner or member).
 *    Nothing is filtered in application code after a broad read, because a filter
 *    that is forgotten once leaks everything.
 * 2. **Rows are never handed out as they are stored.** Ids, foreign keys and
 *    ordering columns stay inside; the caller gets resolved names, dates and times.
 *    That keeps the contract stable when the tables move, and it keeps internal
 *    structure — which user owns what, how ids are numbered — out of the response.
 *
 * The child queries are scoped by `trip_id` in SQL rather than by filtering a
 * wider result set, so a bug in the include handling cannot widen what a caller
 * sees; at worst it returns less.
 */
@Injectable()
export class PublicApiService {
  constructor(
    private readonly db: DatabaseService,
    private readonly membership: TripMembershipService,
  ) {}

  /** Every trip the token's owner may read, newest first, without itineraries. */
  listTrips(userId: number): PublicApiTripSummary[] {
    const ids = this.membership.listAccessibleTripIds(userId);
    if (ids.length === 0) return [];
    const rows = this.db.all<TripRow>(
      `SELECT id, title, description, start_date, end_date, currency, is_archived, updated_at
         FROM trips
        WHERE id IN (${ids.map(() => '?').join(',')})
        ORDER BY start_date DESC, id DESC`,
      ...ids,
    );
    return rows.map(toTripSummary);
  }

  /**
   * One trip with the requested sections, or null when the caller may not read it.
   *
   * Null covers both "no such trip" and "not yours" on purpose — the controller
   * turns both into the same 404, so the endpoint cannot be used to probe which
   * trip ids exist.
   */
  getTrip(tripId: number, userId: number, include: PublicApiInclude[]): PublicApiTrip | null {
    if (!this.db.canAccessTrip(tripId, userId)) return null;
    const row = this.db.get<TripRow>(
      `SELECT id, title, description, start_date, end_date, currency, is_archived, updated_at
         FROM trips WHERE id = ?`,
      tripId,
    );
    if (!row) return null;

    const trip: PublicApiTrip = toTripSummary(row);
    // Places, notes and reservations hang off days, so asking for one of them
    // and not for `days` used to return the trip and nothing else — silently,
    // which is the worst way to answer. Days are implied instead.
    if (DAY_SCOPED.some((section) => include.includes(section))) {
      trip.days = this.buildDays(tripId, include);
    }
    if (include.includes('places')) {
      trip.unplanned_places = this.buildUnplannedPlaces(tripId);
    }
    if (include.includes('reservations')) {
      trip.unscheduled_reservations = this.buildUnscheduledReservations(tripId);
    }
    if (include.includes('accommodations')) {
      trip.accommodations = this.buildAccommodations(tripId);
    }
    if (include.includes('travellers')) {
      trip.travellers = this.buildTravellers(tripId);
    }
    return trip;
  }

  /**
   * The itinerary. Days are the spine: everything dated hangs off one, which is
   * what lets a consumer join on `date` alone.
   *
   * The per-day children are fetched once for the whole trip and grouped in memory
   * rather than queried per day — a two-week trip would otherwise cost 42 round
   * trips for the same rows.
   */
  private buildDays(tripId: number, include: PublicApiInclude[]): PublicApiDay[] {
    const days = this.db.all<DayRow>(
      `SELECT id, day_number, date, title, notes
         FROM days WHERE trip_id = ? ORDER BY day_number ASC`,
      tripId,
    );
    if (days.length === 0) return [];

    const placesByDay = include.includes('places') ? this.placesByDay(tripId) : new Map();
    const notesByDay = include.includes('notes') ? this.dayNotesByDay(tripId) : new Map();
    const reservationsByDay = include.includes('reservations')
      ? this.reservationsByDay(tripId)
      : new Map();

    return days.map((day) => ({
      date: day.date,
      day_number: day.day_number,
      title: day.title ?? null,
      notes: day.notes ?? null,
      places: placesByDay.get(day.id) ?? [],
      day_notes: notesByDay.get(day.id) ?? [],
      reservations: reservationsByDay.get(day.id) ?? [],
    }));
  }

  /**
   * Places in the order the traveller planned to visit them.
   *
   * `order_index` decides the sequence and is then dropped: it is a storage detail
   * that only means something relative to its siblings, and an array already
   * carries order.
   */
  private placesByDay(tripId: number): Map<number, PublicApiPlace[]> {
    const rows = this.db.all<PlaceRow>(
      `SELECT da.day_id,
              p.name, p.address, p.lat, p.lng, p.place_time, p.end_time,
              p.duration_minutes, p.notes, p.transport_mode,
              c.name AS category
         FROM day_assignments da
         JOIN places p ON p.id = da.place_id
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.trip_id = ?
        ORDER BY da.day_id ASC, da.order_index ASC`,
      tripId,
    );
    return groupBy(rows, (r: PlaceRow) => r.day_id, toPlace);
  }

  private dayNotesByDay(tripId: number): Map<number, PublicApiDayNote[]> {
    const rows = this.db.all<DayNoteRow>(
      `SELECT day_id, text, time
         FROM day_notes WHERE trip_id = ?
        ORDER BY day_id ASC, sort_order ASC`,
      tripId,
    );
    return groupBy(rows, (r) => r.day_id, (r) => ({
      text: r.text,
      time: r.time ?? null,
    }));
  }

  /**
   * Bookings, reported on their starting day.
   *
   * A reservation may span days (`end_day_id`), but it is listed once rather than
   * repeated on each — a consumer that sees the same flight on three days has no
   * way to tell that from three flights.
   */
  private reservationsByDay(tripId: number): Map<number, PublicApiReservation[]> {
    const rows = this.db.all<ReservationRow>(
      `SELECT day_id, type, title, location, reservation_time, reservation_end_time,
              status, notes
         FROM reservations
        WHERE trip_id = ? AND day_id IS NOT NULL
        ORDER BY day_id ASC, reservation_time ASC`,
      tripId,
    );
    return groupBy(rows, (r: ReservationRow) => r.day_id, toReservation);
  }

  /**
   * Accommodations with their date range resolved from the start/end day rows.
   *
   * Stored as day ids, reported as ISO dates: a consumer has no way to look up a
   * TREK day id, and the dates are what it actually needs to match its own nights.
   */
  private buildAccommodations(tripId: number): PublicApiAccommodation[] {
    const rows = this.db.all<AccommodationRow>(
      `SELECT p.name, p.address, p.lat, p.lng,
              ds.date AS start_date, de.date AS end_date,
              a.check_in, a.check_out, a.notes
         FROM day_accommodations a
         LEFT JOIN places p ON p.id = a.place_id
         LEFT JOIN days ds ON ds.id = a.start_day_id
         LEFT JOIN days de ON de.id = a.end_day_id
        WHERE a.trip_id = ?
        ORDER BY ds.date ASC`,
      tripId,
    );
    return rows.map((r) => ({
      name: r.name ?? null,
      address: r.address ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
      start_date: r.start_date ?? null,
      end_date: r.end_date ?? null,
      check_in: r.check_in ?? null,
      check_out: r.check_out ?? null,
      notes: r.notes ?? null,
    }));
  }

  /**
   * Places the traveller collected but has not scheduled: no row in
   * `day_assignments`, so they belong to the trip rather than to any day.
   *
   * These are not leftovers. On a real instance roughly half the places on a
   * trip sit here, and they are the ones a consumer can most usefully act on:
   * somewhere the traveller wants to go, with a coordinate, and no claim yet
   * about when.
   *
   * Ordered by creation, which is the only order they have: an unscheduled place
   * has no position relative to its siblings.
   *
   * Hotels are excluded. An accommodation's place has no day assignment either,
   * but it is not a shortlist entry and it is already reported in full under
   * `accommodations` — listing it twice would read as two different intentions.
   */
  private buildUnplannedPlaces(tripId: number): PublicApiPlace[] {
    const rows = this.db.all<Omit<PlaceRow, 'day_id'>>(
      `SELECT p.name, p.address, p.lat, p.lng, p.place_time, p.end_time,
              p.duration_minutes, p.notes, p.transport_mode,
              c.name AS category
         FROM places p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.trip_id = ?
          AND NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.place_id = p.id)
          AND NOT EXISTS (SELECT 1 FROM day_accommodations a WHERE a.place_id = p.id)
        ORDER BY p.created_at ASC, p.id ASC`,
      tripId,
    );
    return rows.map(toPlace);
  }

  /**
   * Bookings with no day. `reservations.day_id` is nullable and a deleted day
   * sets it null rather than cascading, so a flight can outlive the day it was
   * pinned to. Reporting only day-bound bookings would quietly lose those.
   */
  private buildUnscheduledReservations(tripId: number): PublicApiReservation[] {
    const rows = this.db.all<Omit<ReservationRow, 'day_id'>>(
      `SELECT type, title, location, reservation_time, reservation_end_time,
              status, notes
         FROM reservations
        WHERE trip_id = ? AND day_id IS NULL
        ORDER BY reservation_time ASC, id ASC`,
      tripId,
    );
    return rows.map(toReservation);
  }

  /**
   * The caller's bucket list: places they want to reach, with no trip attached.
   *
   * Read here rather than through AtlasService, for the same reason every other
   * table in this file is: importing a domain module for one SELECT drags its
   * whole graph in, and this surface has to be able to boot on its own. The query
   * is scoped by `user_id` in SQL, which is the part that matters.
   *
   * Returns entries even when the Atlas addon is switched off: the addon governs
   * whether TREK shows the feature, not whether the rows exist, and a key whose
   * answers change when an unrelated toggle moves is a key nobody can build on.
   */
  listBucketList(userId: number): PublicApiBucketListItem[] {
    const rows = this.db.all<BucketListRow>(
      `SELECT name, lat, lng, country_code, notes, target_date
         FROM bucket_list WHERE user_id = ?
        ORDER BY created_at DESC, id DESC`,
      userId,
    );
    return rows.map((r) => ({
      name: r.name,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
      country_code: r.country_code ?? null,
      notes: r.notes ?? null,
      target_date: r.target_date ?? null,
    }));
  }

  /**
   * Who is on the trip: the owner first, then members in join order.
   *
   * Names only. The query selects `username` and nothing else — no ids, no email
   * addresses — because an integration key is a credential for reading its owner's
   * itinerary, not for enumerating the people around them. What it returns is
   * exactly what those people already see on the trip in TREK.
   */
  private buildTravellers(tripId: number): PublicApiTraveller[] {
    const rows = this.db.all<TravellerRow>(
      `SELECT u.username, 1 AS is_owner
         FROM trips t JOIN users u ON u.id = t.user_id
        WHERE t.id = ?
        UNION ALL
       SELECT u.username, 0 AS is_owner
         FROM trip_members m JOIN users u ON u.id = m.user_id
        WHERE m.trip_id = ?
        ORDER BY is_owner DESC`,
      tripId, tripId,
    );
    return rows.map((r) => ({ name: r.username, owner: r.is_owner === 1 }));
  }
}

/**
 * Sections that live on a day. Asking for any of them implies `days`, because
 * that is where they are reported.
 */
const DAY_SCOPED: PublicApiInclude[] = ['days', 'places', 'notes', 'reservations'];

/**
 * One definition of what a place looks like on the wire, used both for places on
 * a day and for unscheduled ones. Two copies would drift, and the second copy is
 * always the one that forgets a field.
 */
function toPlace(row: Omit<PlaceRow, 'day_id'>): PublicApiPlace {
  return {
    name: row.name,
    address: row.address ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    time: row.place_time ?? null,
    end_time: row.end_time ?? null,
    duration_minutes: row.duration_minutes ?? null,
    category: row.category ?? null,
    notes: row.notes ?? null,
    transport_mode: row.transport_mode ?? null,
  };
}

function toReservation(row: Omit<ReservationRow, 'day_id'>): PublicApiReservation {
  return {
    type: row.type ?? null,
    title: row.title ?? null,
    location: row.location ?? null,
    time: row.reservation_time ?? null,
    end_time: row.reservation_end_time ?? null,
    status: row.status ?? null,
    notes: row.notes ?? null,
  };
}

function toTripSummary(row: TripRow): PublicApiTripSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    currency: row.currency ?? null,
    archived: row.is_archived === 1,
    updated_at: row.updated_at ?? null,
  };
}

function groupBy<Row, Out>(
  rows: Row[],
  key: (row: Row) => number,
  map: (row: Row) => Out,
): Map<number, Out[]> {
  const grouped = new Map<number, Out[]>();
  for (const row of rows) {
    const id = key(row);
    const bucket = grouped.get(id);
    if (bucket) bucket.push(map(row));
    else grouped.set(id, [map(row)]);
  }
  return grouped;
}

interface TripRow {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string | null;
  is_archived: number | null;
  updated_at: string | null;
}

interface DayRow {
  id: number;
  day_number: number;
  date: string;
  title: string | null;
  notes: string | null;
}

interface PlaceRow {
  day_id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  transport_mode: string | null;
  category: string | null;
}

interface DayNoteRow {
  day_id: number;
  text: string;
  time: string | null;
}

interface ReservationRow {
  day_id: number;
  type: string | null;
  title: string | null;
  location: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  status: string | null;
  notes: string | null;
}

interface TravellerRow {
  username: string;
  is_owner: number;
}

interface AccommodationRow {
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  check_in: string | null;
  check_out: string | null;
  notes: string | null;
}

interface BucketListRow {
  name: string;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  notes: string | null;
  target_date: string | null;
}
