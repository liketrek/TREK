import { z } from 'zod';

/**
 * Live state of a booked flight leg, read from open ADS-B feeds without any key
 * (adsb.lol, adsb.fi). These feeds only know where an aircraft is, so everything
 * an airline would publish (gate, terminal, belt, cancellation) is out of reach;
 * the delays and the arrival estimate are worked out from the positions and are
 * marked as estimates in the UI.
 *
 * Times cross the wire as ISO 8601 UTC strings. A leg is addressed by its
 * reservation and its index in the leg chain (client/src/utils/flightLegs.ts),
 * so a multi-leg booking gets one state per segment.
 */

/**
 * - scheduled: departure is still ahead and the aircraft has not shown up.
 * - taxiing:   the aircraft is seen on the ground at the departure airport.
 * - airborne:  in the air.
 * - landed:    seen on the ground at, or lost low over, the destination.
 * - unknown:   inside the watch window but the callsign never showed up (an
 *              airline flying under another callsign, a codeshare, no coverage).
 */
export const flightLivePhaseSchema = z.enum(['scheduled', 'taxiing', 'airborne', 'landed', 'unknown']);
export type FlightLivePhase = z.infer<typeof flightLivePhaseSchema>;

export const flightLiveSourceSchema = z.enum(['adsb.lol', 'adsb.fi']);
export type FlightLiveSource = z.infer<typeof flightLiveSourceSchema>;

export const flightLivePositionSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  altitude_ft: z.number().nullable(),
  ground_speed_kt: z.number().nullable(),
  /** Degrees clockwise from north, for turning the aircraft icon. */
  track_deg: z.number().nullable(),
  vertical_rate_fpm: z.number().nullable(),
  on_ground: z.boolean(),
});
export type FlightLivePosition = z.infer<typeof flightLivePositionSchema>;

export const flightLiveAirportSchema = z.object({
  /** IATA code, e.g. "FRA". */
  code: z.string(),
  name: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  /** IANA zone the schedule is local to, e.g. "Europe/Berlin". */
  timezone: z.string().nullable(),
});
export type FlightLiveAirport = z.infer<typeof flightLiveAirportSchema>;

export const flightLiveLegSchema = z.object({
  reservation_id: z.number().int(),
  leg_index: z.number().int().min(0),
  /** ICAO callsign as transmitted, e.g. "DLH400". */
  callsign: z.string(),
  /** The booked flight number as the user knows it, e.g. "LH 400". */
  flight_number: z.string(),
  /** Local departure date of the leg, YYYY-MM-DD. */
  service_date: z.string(),
  /** Both ends of the leg, so the client can show local times and draw the arc. */
  origin: flightLiveAirportSchema,
  destination: flightLiveAirportSchema,
  phase: flightLivePhaseSchema,
  scheduled_departure: z.string().nullable(),
  scheduled_arrival: z.string().nullable(),
  /** Observed wheels-up, or null while unknown. */
  departed_at: z.string().nullable(),
  /** Observed touchdown, or null while unknown. */
  landed_at: z.string().nullable(),
  /** Arrival estimate from remaining distance and ground speed; null on the ground. */
  estimated_arrival: z.string().nullable(),
  /** Minutes late (negative when early) against the schedule; null until observed or estimated. */
  departure_delay_min: z.number().int().nullable(),
  arrival_delay_min: z.number().int().nullable(),
  /** Share of the great-circle distance flown, 0 to 1. */
  progress: z.number().min(0).max(1).nullable(),
  distance_total_km: z.number().nullable(),
  distance_remaining_km: z.number().nullable(),
  position: flightLivePositionSchema.nullable(),
  aircraft: z
    .object({
      registration: z.string().nullable(),
      /** ICAO type designator, e.g. "A20N". */
      type: z.string().nullable(),
    })
    .nullable(),
  /** When the feed last heard the aircraft. */
  last_seen_at: z.string().nullable(),
  /** When TREK last asked the feed. */
  fetched_at: z.string().nullable(),
  /** True when the last position is too old to trust, e.g. over an ocean. */
  stale: z.boolean(),
  source: flightLiveSourceSchema.nullable(),
});
export type FlightLiveLeg = z.infer<typeof flightLiveLegSchema>;

export const tripFlightLiveResponseSchema = z.object({
  /** False when the admin switched live flight data off; the client then hides it. */
  enabled: z.boolean(),
  /** Credit line the feed's terms ask for, shown next to live data. */
  attribution: z.string().nullable(),
  flights: z.array(flightLiveLegSchema),
});
export type TripFlightLiveResponse = z.infer<typeof tripFlightLiveResponseSchema>;
