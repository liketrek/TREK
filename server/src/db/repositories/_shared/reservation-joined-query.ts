import type { DB } from '../../kysely/db';

import type { Kysely } from 'kysely';

/** The tables the joined booking projection reads. */
export type ReservationJoinDB = Pick<DB, 'reservations' | 'days' | 'places' | 'day_accommodations'>;

/**
 * A booking with its day number, its place's name and its stay's place and
 * times: the projection `ReservationsRepository.listForTrip` and
 * `findWithJoins` narrow with their own `WHERE`. Kept out of the repository
 * file, which is at its size baseline.
 */
export function joinedReservationQuery(kysely: Kysely<ReservationJoinDB>) {
  return kysely
    .selectFrom('reservations as r')
    .leftJoin('days as d', 'd.id', 'r.day_id')
    .leftJoin('places as p', 'p.id', 'r.place_id')
    .leftJoin('day_accommodations as ap', 'ap.id', 'r.accommodation_id')
    .leftJoin('places as acc_p', 'acc_p.id', 'ap.place_id')
    .selectAll('r')
    .select([
      'd.day_number as day_number',
      'p.name as place_name',
      'ap.place_id as accommodation_place_id',
      'acc_p.name as accommodation_name',
      'ap.start_day_id as accommodation_start_day_id',
      'ap.end_day_id as accommodation_end_day_id',
      'ap.check_in as accommodation_check_in',
      'ap.check_in_end as accommodation_check_in_end',
      'ap.check_out as accommodation_check_out',
    ]);
}

/**
 * The booking an import already wrote into this trip under the same origin,
 * or undefined: what `idx_reservations_external (external_source,
 * external_id, trip_id)` would refuse, read before the write so a repeat
 * import is reported instead of failing on the unique index
 * (`ReservationsRepository.findIdByExternal`).
 */
export async function idByExternalQuery(
  kysely: Kysely<Pick<DB, 'reservations'>>,
  trip_id: number,
  external_source: string,
  external_id: string,
): Promise<number | undefined> {
  const row = await kysely
    .selectFrom('reservations')
    .select(['id'])
    .where('trip_id', '=', trip_id)
    .where('external_source', '=', external_source)
    .where('external_id', '=', external_id)
    .executeTakeFirst();
  return row?.id;
}
