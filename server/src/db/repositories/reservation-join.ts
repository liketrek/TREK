/**
 * RS18/RR1's joined read of reservations: the row shape, the Kysely tables it
 * binds and the statement. It lives beside the reservations repository so
 * that file stays readable; the repository re-exports the row type, so
 * callers keep importing it from there.
 */
import { castIntegerKysely } from '../dialect/kysely-functions';
import type { DB } from '../kysely/db';
import type { ReservationAllColumnsRow } from './Reservations.repository';
import type { Platform } from '@mikro-orm/core';

import type { Kysely } from 'kysely';

/**
 * RS18/RR1's shared joined projection — `SELECT r.*, d.day_number, p.name as
 * place_name, r.assignment_id, ap.place_id as accommodation_place_id,
 * acc_p.name as accommodation_name, ap.start_day_id as
 * accommodation_start_day_id, ap.end_day_id as accommodation_end_day_id FROM
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
}

/**
 * Kysely typing for the RS18/RR1 join — `reservations.accommodation_id` is a
 * bare `p.text().nullable()` column with no FK to `day_accommodations` (§18.1
 * of the inventory), so the QueryBuilder's relation-path `.join()` cannot
 * express `LEFT JOIN day_accommodations ap ON r.accommodation_id = ap.id` at
 * all — the same escape hatch `DayAssignmentsRepository.effectiveStart`/
 * `TripsRepository.tripSelectQuery` use. The `id`/`trip_id` the callers pass
 * stay `number | string` (raw-bind, D4's T5 seam) and are cast to the column
 * type only at the bind, so this join keeps the legacy statement's exact
 * raw-bind flexibility.
 */
export type ReservationJoinKyselyDB = Pick<DB, 'reservations' | 'days' | 'places' | 'day_accommodations'>;

/**
 * The joined projection, without a WHERE or ORDER BY: each caller adds its
 * own. `accommodation_id` is TEXT and `ap.id` INTEGER, so the text side is
 * cast for the join (SQLite coerces the bare comparison, Postgres refuses it
 * with 42883).
 */
export function selectReservationsWithJoins(db: Kysely<ReservationJoinKyselyDB>, platform: Platform) {
  return db
    .selectFrom('reservations as r')
    .leftJoin('days as d', 'd.id', 'r.day_id')
    .leftJoin('places as p', 'p.id', 'r.place_id')
    .leftJoin('day_accommodations as ap', (join) =>
      join.on((eb) => eb(castIntegerKysely(platform, eb, 'r.accommodation_id'), '=', eb.ref('ap.id'))),
    )
    .leftJoin('places as acc_p', 'acc_p.id', 'ap.place_id')
    .selectAll('r')
    .select([
      'd.day_number as day_number',
      'p.name as place_name',
      'ap.place_id as accommodation_place_id',
      'acc_p.name as accommodation_name',
      'ap.start_day_id as accommodation_start_day_id',
      'ap.end_day_id as accommodation_end_day_id',
    ]);
}
