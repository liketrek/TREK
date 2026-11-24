import type { FlightLiveStates } from '../entities/FlightLiveStates.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import { TrekRepository } from './_shared/trek-repository';

/** A flight booking as the live flight status reads it; the metadata is the stored text. */
export interface FlightBookingDbRow {
  id: number;
  trip_id: number;
  trip_title: string;
  metadata: string | null;
  day_id: number | null;
  end_day_id: number | null;
  reservation_time: string | null;
  reservation_end_time: string | null;
}

interface FlightEndpointDbRow {
  reservation_id: number;
  role: string;
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_date: string | null;
  local_time: string | null;
}

/**
 * One flight state, every column; timestamps in the canonical UTC text. `T`
 * is `string` for a row read back and `DbTimestamp` for one being written.
 */
interface FlightLiveStateFields<T extends string> {
  callsign: string;
  service_date: string;
  origin: string;
  destination: string;
  phase: string;
  departed_at: T | null;
  landed_at: T | null;
  lat: number | null;
  lng: number | null;
  altitude_ft: number | null;
  ground_speed_kt: number | null;
  track_deg: number | null;
  vertical_rate_fpm: number | null;
  on_ground: number | null;
  registration: string | null;
  aircraft_type: string | null;
  source: string | null;
  first_seen_at: T | null;
  last_seen_at: T | null;
  fetched_at: T | null;
  next_poll_at: T | null;
  fail_count: number;
  departed_notified: number;
  landed_notified: number;
  delay_notified: number;
}

export type FlightLiveStateRow = FlightLiveStateFields<string>;
export type FlightLiveStateWrite = FlightLiveStateFields<DbTimestamp>;

const BOOKING_COLUMNS = [
  'reservations.id',
  'reservations.trip_id',
  'reservations.metadata',
  'reservations.day_id',
  'reservations.end_day_id',
  'reservations.reservation_time',
  'reservations.reservation_end_time',
] as const;

const ENDPOINT_COLUMNS = [
  'reservation_id',
  'role',
  'sequence',
  'name',
  'code',
  'lat',
  'lng',
  'timezone',
  'local_date',
  'local_time',
] as const;

/**
 * `flight_live_states`: what the open ADS-B feeds last said about a flight on
 * a day, one row per (callsign, service date, origin, destination) whichever
 * trips booked it.
 *
 * The flight bookings, their endpoints, the days they name and their
 * travellers are read here too, through Kysely: the live status only reads
 * them, and the reservations domain has no read of flights across all trips.
 */
export class FlightLiveStatesRepository extends TrekRepository<FlightLiveStates> {
  /** The flight bookings of one trip. */
  async listFlightBookingsForTrip(trip_id: number): Promise<FlightBookingDbRow[]> {
    return await this.kysely<Pick<DB, 'reservations' | 'trips'>>()
      .selectFrom('reservations')
      .innerJoin('trips', 'trips.id', 'reservations.trip_id')
      .select([...BOOKING_COLUMNS, 'trips.title as trip_title'])
      .where('reservations.trip_id', '=', trip_id)
      .where('reservations.type', '=', 'flight')
      .orderBy('reservations.id')
      .execute();
  }

  /**
   * The flight bookings of every trip that is not archived and whose dates
   * (where it has any) reach into `from_date`..`to_date`: the candidates for a
   * poll. Which leg is really in its window the caller works out from the
   * schedule.
   */
  async listFlightBookingsBetween(from_date: string, to_date: string): Promise<FlightBookingDbRow[]> {
    return await this.kysely<Pick<DB, 'reservations' | 'trips'>>()
      .selectFrom('reservations')
      .innerJoin('trips', 'trips.id', 'reservations.trip_id')
      .select([...BOOKING_COLUMNS, 'trips.title as trip_title'])
      .where('reservations.type', '=', 'flight')
      .where((eb) => eb.or([eb('trips.is_archived', 'is', null), eb('trips.is_archived', '=', 0)]))
      .where((eb) => eb.or([eb('trips.end_date', 'is', null), eb('trips.end_date', '>=', from_date)]))
      .where((eb) => eb.or([eb('trips.start_date', 'is', null), eb('trips.start_date', '<=', to_date)]))
      .orderBy('reservations.id')
      .execute();
  }

  /** The endpoints of the given bookings, in their order. */
  async listEndpoints(reservation_ids: readonly number[]): Promise<FlightEndpointDbRow[]> {
    if (reservation_ids.length === 0) return [];
    return await this.kysely<Pick<DB, 'reservation_endpoints'>>()
      .selectFrom('reservation_endpoints')
      .select([...ENDPOINT_COLUMNS])
      .where('reservation_id', 'in', [...reservation_ids])
      .orderBy('reservation_id')
      .orderBy('sequence')
      .execute();
  }

  /** The date of each given trip day that has one. */
  async listDayDates(day_ids: readonly number[]): Promise<Array<{ id: number; date: string }>> {
    if (day_ids.length === 0) return [];
    const rows = await this.kysely<Pick<DB, 'days'>>()
      .selectFrom('days')
      .select(['id', 'date'])
      .where('id', 'in', [...day_ids])
      .execute();
    return rows.flatMap((row) => (row.date ? [{ id: row.id, date: row.date }] : []));
  }

  /**
   * The users put on a booking as its travellers who still belong to its trip:
   * the owner or a member. Someone removed from the trip stays on the
   * traveller list until it is edited, and must hear nothing more of it.
   */
  async listTravelerIds(reservation_id: number): Promise<number[]> {
    const rows = await this.kysely<Pick<DB, 'reservation_travelers' | 'reservations' | 'trips' | 'trip_members'>>()
      .selectFrom('reservation_travelers as rt')
      .innerJoin('reservations as r', 'r.id', 'rt.reservation_id')
      .innerJoin('trips as t', 't.id', 'r.trip_id')
      .select('rt.user_id')
      .where('rt.reservation_id', '=', reservation_id)
      .where((eb) =>
        eb.or([
          eb('t.user_id', '=', eb.ref('rt.user_id')),
          eb.exists(
            eb
              .selectFrom('trip_members as tm')
              .select('tm.id')
              .whereRef('tm.trip_id', '=', 'r.trip_id')
              .whereRef('tm.user_id', '=', 'rt.user_id'),
          ),
        ]),
      )
      .orderBy('rt.user_id')
      .execute();
    return rows.map((row) => row.user_id);
  }

  /** Every stored state of the given callsigns, whatever their day. */
  async findForCallsigns(callsigns: readonly string[]): Promise<FlightLiveStateRow[]> {
    if (callsigns.length === 0) return [];
    return await this.kysely<Pick<DB, 'flight_live_states'>>()
      .selectFrom('flight_live_states')
      .selectAll()
      .where('callsign', 'in', [...callsigns])
      .execute();
  }

  /** Writes a flight's whole state, replacing the one stored under its key. */
  async saveState(row: FlightLiveStateWrite): Promise<void> {
    const { callsign, service_date, origin, destination, ...changes } = row;
    await this.kysely<Pick<DB, 'flight_live_states'>>()
      .insertInto('flight_live_states')
      .values({ callsign, service_date, origin, destination, ...changes })
      .onConflict((oc) => oc.columns(['callsign', 'service_date', 'origin', 'destination']).doUpdateSet(changes))
      .execute();
  }

  /** Drops the states of flights that departed before `service_date`; answers how many went. */
  async deleteBefore(service_date: string): Promise<number> {
    const result = await this.kysely<Pick<DB, 'flight_live_states'>>()
      .deleteFrom('flight_live_states')
      .where('service_date', '<', service_date)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
