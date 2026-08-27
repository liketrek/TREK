import { Injectable } from '@nestjs/common';
import type {
  PublicApiAccommodation,
  PublicApiDay,
  PublicApiDayNote,
  PublicApiInclude,
  PublicApiPlace,
  PublicApiReservation,
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
      `SELECT id, title, description, start_date, end_date, currency, is_archived
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
      `SELECT id, title, description, start_date, end_date, currency, is_archived
         FROM trips WHERE id = ?`,
      tripId,
    );
    if (!row) return null;

    const trip: PublicApiTrip = toTripSummary(row);
    if (include.includes('days')) {
      trip.days = this.buildDays(tripId, include);
    }
    if (include.includes('accommodations')) {
      trip.accommodations = this.buildAccommodations(tripId);
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
    return groupBy(rows, (r) => r.day_id, (r) => ({
      name: r.name,
      address: r.address ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
      time: r.place_time ?? null,
      end_time: r.end_time ?? null,
      duration_minutes: r.duration_minutes ?? null,
      category: r.category ?? null,
      notes: r.notes ?? null,
      transport_mode: r.transport_mode ?? null,
    }));
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
    return groupBy(rows, (r) => r.day_id, (r) => ({
      type: r.type ?? null,
      title: r.title ?? null,
      location: r.location ?? null,
      time: r.reservation_time ?? null,
      end_time: r.reservation_end_time ?? null,
      status: r.status ?? null,
      notes: r.notes ?? null,
    }));
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
