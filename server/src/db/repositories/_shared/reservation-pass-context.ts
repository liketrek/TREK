import type { DB } from '../../kysely/db';

import type { Kysely } from 'kysely';

/** The tables `passContextQuery` reads. */
export type PassContextDB = Pick<DB, 'reservations' | 'trips' | 'places' | 'day_accommodations'>;

/** What a booking's Wallet pass needs beyond the booking: where it is, and the trip's name. */
export interface ReservationPassContext {
  trip_title: string | null;
  place_lat: number | null;
  place_lng: number | null;
  place_name: string | null;
}

/**
 * The trip's title and the place a booking is at (its own place, else its
 * stay's), for its Apple Wallet pass (`ReservationsRepository.findPassContext`).
 * Scoped to the trip, so a booking of another trip reads as none. Kept out of
 * the repository file, which is at its size baseline.
 */
export async function passContextQuery(
  kysely: Kysely<PassContextDB>,
  id: number,
  trip_id: number,
): Promise<ReservationPassContext | undefined> {
  const row = await kysely
    .selectFrom('reservations as r')
    .innerJoin('trips as t', 't.id', 'r.trip_id')
    .leftJoin('places as p', 'p.id', 'r.place_id')
    // accommodation_id is TEXT; compared as a number so Postgres takes it as well as SQLite ("14" and "14.0" alike).
    .leftJoin('day_accommodations as ap', (join) =>
      join.on((eb) => eb(eb.cast<number>('r.accommodation_id', 'numeric'), '=', eb.ref('ap.id'))),
    )
    .leftJoin('places as acc_p', 'acc_p.id', 'ap.place_id')
    .where('r.id', '=', id)
    .where('r.trip_id', '=', trip_id)
    .select([
      't.title as trip_title',
      (eb) => eb.fn.coalesce('p.lat', 'acc_p.lat').as('place_lat'),
      (eb) => eb.fn.coalesce('p.lng', 'acc_p.lng').as('place_lng'),
      (eb) => eb.fn.coalesce('p.name', 'acc_p.name').as('place_name'),
    ])
    .executeTakeFirst();
  return row as ReservationPassContext | undefined;
}
