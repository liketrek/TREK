/**
 * The row shapes the reservations repository answers for the public API
 * (`public-api.service.ts`), with the Kysely table subsets their reads bind.
 * They live beside the repository so its file stays readable; the repository
 * re-exports the row types, so callers keep importing them from there.
 */
import type { DB } from '../kysely/db';

/**
 * `public-api.service.ts::reservationsByDay` (Task 5's `// Task 2` pickup)
 * — `SELECT day_id, type, title, location, reservation_time,
 * reservation_end_time, status, notes FROM reservations WHERE trip_id = ?
 * AND day_id IS NOT NULL ORDER BY day_id ASC, reservation_time ASC`.
 */
export interface PublicApiScheduledReservationRow {
  day_id: number;
  type: string | null;
  title: string | null;
  location: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  status: string | null;
  notes: string | null;
}

/**
 * `public-api.service.ts::buildUnscheduledReservations` (Task 5's `// Task
 * 2` pickup) — the same 7 columns minus `day_id`, `WHERE trip_id = ? AND
 * day_id IS NULL ORDER BY reservation_time ASC, id ASC`.
 */
export type PublicApiUnscheduledReservationRow = Omit<PublicApiScheduledReservationRow, 'day_id'>;

export type PublicApiReservationKyselyDB = Pick<DB, 'reservations'>;

/**
 * `public-api.service.ts::buildAccommodations` (Task 5's `// Task 3`
 * pickup) — `SELECT p.name, p.address, p.lat, p.lng, ds.date AS start_date,
 * de.date AS end_date, a.check_in, a.check_out, a.notes FROM
 * day_accommodations a LEFT JOIN places p ON p.id = a.place_id LEFT JOIN
 * days ds ON ds.id = a.start_day_id LEFT JOIN days de ON de.id =
 * a.end_day_id WHERE a.trip_id = ? ORDER BY ds.date ASC`.
 */
export interface PublicApiAccommodationRow {
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

export type PublicApiAccommodationKyselyDB = Pick<DB, 'day_accommodations' | 'places' | 'days'>;

/**
 * `public-api.service.ts::buildUnplannedPlaces` (Task 5's `// Task 3`
 * pickup — "the whole statement stays raw rather than splitting the
 * places/day_assignments reads from the one 3d-table predicate", the
 * method's own comment) — `SELECT p.name, p.address, p.lat, p.lng,
 * p.place_time, p.end_time, p.duration_minutes, p.notes, p.transport_mode,
 * c.name AS category FROM places p LEFT JOIN categories c ON c.id =
 * p.category_id WHERE p.trip_id = ? AND NOT EXISTS (SELECT 1 FROM
 * day_assignments da WHERE da.place_id = p.id) AND NOT EXISTS (SELECT 1
 * FROM day_accommodations a WHERE a.place_id = p.id) ORDER BY
 * p.created_at ASC, p.id ASC`.
 */
export interface PublicApiUnplannedPlaceRow {
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

export type PublicApiUnplannedPlaceKyselyDB = Pick<
  DB,
  'places' | 'categories' | 'day_assignments' | 'day_accommodations'
>;
