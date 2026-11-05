/**
 * The rows `ReservationsRepository` answers with for a whole reservation, and
 * the Kysely tables its joined read binds: what a reservation is read as, kept
 * apart from the statements that read it. The repository re-exports the row
 * types, so callers keep importing them from there.
 */
import type { DB } from '../kysely/db';

/** `SELECT *` — every scalar column of `Reservations`, RS35's shape. */
export interface ReservationAllColumnsRow {
  id: number;
  trip_id: number;
  day_id: number | null;
  end_day_id: number | null;
  place_id: number | null;
  assignment_id: number | null;
  title: string;
  accommodation_id: string | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
  location: string | null;
  confirmation_number: string | null;
  notes: string | null;
  status: string | null;
  type: string | null;
  created_at: string | null;
  metadata: string | null;
  day_plan_position: number | null;
  needs_review: number;
  external_source: string | null;
  external_id: string | null;
  external_owner_user_id: number | null;
  external_synced_at: string | null;
  sync_enabled: number | null;
  external_hash: string | null;
  url: string | null;
  ingest_state: string;
}

/**
 * RS18/RR1's shared joined projection — `SELECT r.*, d.day_number, p.name as
 * place_name, r.assignment_id, ap.place_id as accommodation_place_id,
 * acc_p.name as accommodation_name, ap.start_day_id as
 * accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id FROM
 * reservations r LEFT JOIN days d ON r.day_id = d.id LEFT JOIN places p ON
 * r.place_id = p.id LEFT JOIN day_accommodations ap ON r.accommodation_id =
 * ap.id LEFT JOIN places acc_p ON ap.place_id = acc_p.id`. The service
 * folds `accommodation_id` (`Math.trunc(Number(x))`), `day_positions`,
 * `endpoints` and `travelers` on afterward.
 */
export interface ReservationJoinRow extends ReservationAllColumnsRow {
  day_number: number | null;
  place_name: string | null;
  accommodation_place_id: number | null;
  accommodation_name: string | null;
  accommodation_start_day_id: number | null;
  accommodation_end_day_id: number | null;
}

/**
 * The tables the RS18/RR1 join binds (`ReservationsRepository.joinedQuery`).
 * `reservations.accommodation_id` is a TEXT column with no foreign key to
 * `day_accommodations`, so the QueryBuilder's relation joins cannot express
 * `LEFT JOIN day_accommodations ap ON r.accommodation_id = ap.id`; the join
 * is written in Kysely, as `DayAssignmentsRepository.effectiveStart` and
 * `TripsRepository.tripSelectQuery` do.
 */
export type ReservationJoinKyselyDB = Pick<DB, 'reservations' | 'days' | 'places' | 'day_accommodations'>;
