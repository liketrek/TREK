import type { DB } from '../../kysely/db';
import { accommodationIdMatches } from './reservation-accommodation';
import type { SqlEntityManager } from '@mikro-orm/sql';

/** The tables `passContextQuery` reads. */
type PassContextDB = Pick<DB, 'reservations' | 'trips' | 'places' | 'day_accommodations'>;

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
 * the repository file, which is at its size baseline. `em` is the repository's
 * own, which has checked the request context.
 */
export async function passContextQuery(
  em: SqlEntityManager,
  id: number,
  trip_id: number,
): Promise<ReservationPassContext | undefined> {
  const platform = em.getPlatform();
  const row = await em
    .getKysely<PassContextDB>()
    .selectFrom('reservations as r')
    .innerJoin('trips as t', 't.id', 'r.trip_id')
    .leftJoin('places as p', 'p.id', 'r.place_id')
    .leftJoin('day_accommodations as ap', (join) =>
      join.on((eb) => accommodationIdMatches(platform, eb, 'r.accommodation_id', 'ap.id')),
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
