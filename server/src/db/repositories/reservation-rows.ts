/**
 * The row shapes ReservationsRepository reads: every column of a reservation,
 * and the joined projection the trip list and the single reads share.
 */

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
 * accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id,
 * ap.check_in/check_in_end/check_out as accommodation_check_in/_check_in_end/_check_out FROM
 * reservations r LEFT JOIN days d ON r.day_id = d.id LEFT JOIN places p ON
 * r.place_id = p.id LEFT JOIN day_accommodations ap ON r.accommodation_id =
 * ap.id LEFT JOIN places acc_p ON ap.place_id = acc_p.id`. The service
 * folds `accommodation_id` (`Math.trunc(Number(x))`), `day_positions`,
 * `endpoints` and `travelers` on afterward (unchanged from the legacy split).
 */
export interface ReservationJoinRow extends ReservationAllColumnsRow {
  day_number: number | null;
  place_name: string | null;
  accommodation_place_id: number | null;
  accommodation_name: string | null;
  accommodation_start_day_id: number | null;
  accommodation_end_day_id: number | null;
  /** The stay's own times, which a hotel booking's card falls back to. */
  accommodation_check_in: string | null;
  accommodation_check_in_end: string | null;
  accommodation_check_out: string | null;
}
