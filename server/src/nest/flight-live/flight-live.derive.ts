import { haversineKm } from '../common/geo';
import type { ScheduledLeg } from './flight-live.schedule';
import type { FlightLiveLeg, FlightLivePhase, FlightLivePosition, FlightLiveSource } from '@trek/shared';

/**
 * What the positions of an aircraft say about a booked flight, worked out
 * without the airline: the phase, wheels-up and touchdown, the delays and the
 * arrival estimate, and when to ask the feed again. Pure, every clock passed
 * in as epoch milliseconds.
 */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const KT_TO_KMH = 1.852;

/** The watch window around a leg: from three hours before departure to two after arrival. */
const WATCH_BEFORE_MS = 3 * HOUR;
const WATCH_AFTER_MS = 2 * HOUR;
/** Without a scheduled arrival the window closes this long after departure. */
const ASSUMED_FLIGHT_MS = 16 * HOUR;
/** A callsign not heard this long after the scheduled departure is reported unknown. */
const UNKNOWN_AFTER_MS = 2 * HOUR;
/** An airborne aircraft not heard for longer is shown as stale. */
const STALE_AFTER_MS = 10 * MIN;
/** Approach, landing and taxi on top of the great-circle flight time. */
const APPROACH_BUFFER_MS = 8 * MIN;

/** One aircraft as the feed reported it, already validated. */
export interface FeedAircraft {
  hex: string;
  flight: string | null;
  registration: string | null;
  type: string | null;
  /** Feet; 'ground' when the transponder says it is on the ground. */
  alt_baro: number | 'ground' | null;
  alt_geom: number | null;
  gs: number | null;
  track: number | null;
  baro_rate: number | null;
  geom_rate: number | null;
  lat: number | null;
  lon: number | null;
  /** Seconds since the feed last heard the aircraft, and since its last position. */
  seen: number | null;
  seen_pos: number | null;
}

/** The state of one flight (callsign, service date) between polls; times are epoch ms. */
export interface LiveState {
  callsign: string;
  service_date: string;
  /** IATA codes of the sector: one flight number can fly two sectors on one day. */
  origin: string;
  destination: string;
  phase: FlightLivePhase;
  departed_at: number | null;
  landed_at: number | null;
  position: FlightLivePosition | null;
  registration: string | null;
  aircraft_type: string | null;
  source: FlightLiveSource | null;
  first_seen_at: number | null;
  last_seen_at: number | null;
  fetched_at: number | null;
  next_poll_at: number | null;
  fail_count: number;
  departed_notified: boolean;
  landed_notified: boolean;
  delay_notified: boolean;
}

export function emptyState(callsign: string, service_date: string, origin: string, destination: string): LiveState {
  return {
    callsign,
    service_date,
    origin,
    destination,
    phase: 'scheduled',
    departed_at: null,
    landed_at: null,
    position: null,
    registration: null,
    aircraft_type: null,
    source: null,
    first_seen_at: null,
    last_seen_at: null,
    fetched_at: null,
    next_poll_at: null,
    fail_count: 0,
    departed_notified: false,
    landed_notified: false,
    delay_notified: false,
  };
}

type Route = Pick<ScheduledLeg, 'origin' | 'destination' | 'scheduled_departure' | 'scheduled_arrival'>;
type Schedule = Pick<Route, 'scheduled_departure' | 'scheduled_arrival'>;
type WatchWindow = { start: number; end: number };

function kmTo(lat: number, lng: number, airport: { lat: number; lng: number }): number {
  return haversineKm(lat, lng, airport.lat, airport.lng);
}

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** The leg's watch window, or null without a scheduled departure. */
export function watchWindow(leg: Schedule): WatchWindow | null {
  if (leg.scheduled_departure === null) return null;
  const arrival = leg.scheduled_arrival ?? leg.scheduled_departure + ASSUMED_FLIGHT_MS;
  return { start: leg.scheduled_departure - WATCH_BEFORE_MS, end: arrival + WATCH_AFTER_MS };
}

export function inWatchWindow(leg: Schedule, now: number): boolean {
  const span = watchWindow(leg);
  return span !== null && now >= span.start && now <= span.end;
}

/**
 * The aircraft that flies this leg among those the feed answered for the
 * callsign: the one with a position nearest the great circle between the two
 * airports (least detour over the direct distance). A callsign is reused by
 * the next leg of a rotation, so two can be in the air at once.
 */
export function pickAircraft(aircraft: readonly FeedAircraft[], route: Route): FeedAircraft | null {
  const total = kmTo(route.origin.lat, route.origin.lng, route.destination);
  let best: FeedAircraft | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const ac of aircraft) {
    const lat = finite(ac.lat);
    const lng = finite(ac.lon);
    const score =
      lat === null || lng === null
        ? Number.MAX_VALUE
        : kmTo(lat, lng, route.origin) + kmTo(lat, lng, route.destination) - total;
    if (best === null || score < bestScore) {
      best = ac;
      bestScore = score;
    }
  }
  return best;
}

/** The aircraft's report as a position at its own time; null without coordinates. */
export function observe(
  ac: FeedAircraft,
  now: number,
): { position: FlightLivePosition; positionAt: number; heardAt: number } | null {
  const lat = finite(ac.lat);
  const lng = finite(ac.lon);
  if (lat === null || lng === null) return null;
  const onGround = ac.alt_baro === 'ground';
  const baro = typeof ac.alt_baro === 'number' ? finite(ac.alt_baro) : null;
  const altitude = onGround ? 0 : (baro ?? finite(ac.alt_geom));
  return {
    position: {
      lat,
      lng,
      altitude_ft: altitude,
      ground_speed_kt: finite(ac.gs),
      track_deg: finite(ac.track),
      vertical_rate_fpm: finite(ac.baro_rate) ?? finite(ac.geom_rate),
      on_ground: onGround,
    },
    positionAt: now - Math.max(0, finite(ac.seen_pos) ?? finite(ac.seen) ?? 0) * 1000,
    heardAt: now - Math.max(0, finite(ac.seen) ?? 0) * 1000,
  };
}

/**
 * The next state of a flight after one answer from the feed. `aircraft` is the
 * picked one, or null when the feed knew nothing of the callsign.
 *
 * - On the ground within 30 km of the destination after having flown, or
 *   after the scheduled departure: landed.
 * - On the ground at the origin: taxiing.
 * - In the air: airborne; wheels-up is the first airborne report while still
 *   below 10,000 ft within 60 km of the origin, else it stays unknown.
 * - Lost below 5,000 ft within 40 km of the destination and not heard for ten
 *   minutes: landed at its last report.
 * - Never heard two hours after the scheduled departure: unknown.
 */
export function advance(
  prev: LiveState,
  aircraft: FeedAircraft | null,
  route: Route,
  now: number,
  source: FlightLiveSource,
): LiveState {
  const next: LiveState = { ...prev, fetched_at: now, source, fail_count: 0 };
  if (prev.phase === 'landed') return next;
  const seen = aircraft ? observe(aircraft, now) : null;

  if (seen && aircraft) {
    const { position, positionAt, heardAt } = seen;
    const fromOrigin = kmTo(position.lat, position.lng, route.origin);
    const toDestination = kmTo(position.lat, position.lng, route.destination);
    const hasFlown = prev.phase === 'airborne' || prev.departed_at !== null;
    next.position = position;
    next.registration = aircraft.registration ?? prev.registration;
    next.aircraft_type = aircraft.type ?? prev.aircraft_type;
    next.first_seen_at = prev.first_seen_at ?? heardAt;
    next.last_seen_at = heardAt;
    if (position.on_ground) {
      // Down at the destination after the scheduled departure counts even unseen in the air (no coverage at
      // the origin); down anywhere else after flying is a diversion.
      const departureDue = route.scheduled_departure !== null && now >= route.scheduled_departure;
      const atDestination = toDestination <= 30 && (hasFlown || departureDue);
      if (atDestination || (hasFlown && fromOrigin > 30)) {
        next.phase = 'landed';
        next.landed_at = prev.landed_at ?? positionAt;
      } else {
        next.phase = 'taxiing';
      }
    } else {
      if (prev.phase !== 'airborne' && prev.departed_at === null) {
        const low = position.altitude_ft !== null && position.altitude_ft < 10000;
        next.departed_at = low && fromOrigin <= 60 ? positionAt : null;
      }
      next.phase = 'airborne';
    }
    return next;
  }

  if (prev.phase === 'airborne' && prev.position && prev.last_seen_at !== null) {
    const { lat, lng, altitude_ft } = prev.position;
    const lostLow = altitude_ft !== null && altitude_ft < 5000 && kmTo(lat, lng, route.destination) <= 40;
    if (lostLow && now - prev.last_seen_at >= STALE_AFTER_MS) {
      next.phase = 'landed';
      next.landed_at = prev.last_seen_at;
      return next;
    }
  }
  if (
    prev.first_seen_at === null &&
    route.scheduled_departure !== null &&
    now >= route.scheduled_departure + UNKNOWN_AFTER_MS
  ) {
    next.phase = 'unknown';
  }
  return next;
}

/** Whether the leg's watch window is over. */
function windowOver(leg: Schedule, now: number): boolean {
  const span = watchWindow(leg);
  return span !== null && now > span.end;
}

/**
 * A flight still taxiing or in the air when its window closes went quiet
 * without a landing anyone saw (out of coverage, switched off): it is closed
 * as unknown, never left in the air, and asked about no more.
 */
export function closeIfOver(state: LiveState, route: Schedule, now: number): LiveState {
  if (!windowOver(route, now) || (state.phase !== 'airborne' && state.phase !== 'taxiing')) return state;
  return { ...state, phase: 'unknown', next_poll_at: null };
}

/** A failed ask: the state stays, the failure is counted. */
export function failed(prev: LiveState): LiveState {
  return { ...prev, fail_count: prev.fail_count + 1 };
}

/**
 * When to ask the feed next about this flight, or null to stop: landed, or
 * past its window.
 *
 * - unknown: every 15 minutes until the window closes;
 * - airborne: every 3 minutes, every 6 when more than two hours of flying
 *   from both airports at its ground speed;
 * - more than 40 minutes before departure: every 10 minutes;
 * - around departure until airborne: every 2 minutes;
 * - three failures in a row: 15 minutes.
 */
export function nextPollAt(state: LiveState, route: Route, now: number): number | null {
  if (state.phase === 'landed') return null;
  const span = watchWindow(route);
  if (!span || now > span.end) return null;
  if (state.fail_count >= 3 || state.phase === 'unknown') return now + 15 * MIN;
  if (state.phase === 'airborne') {
    const at = state.position;
    const gs = at?.ground_speed_kt ?? null;
    if (at && gs !== null && gs > 0) {
      const kmh = gs * KT_TO_KMH;
      const hoursFrom = (airport: { lat: number; lng: number }) => kmTo(at.lat, at.lng, airport) / kmh;
      if (hoursFrom(route.origin) > 2 && hoursFrom(route.destination) > 2) return now + 6 * MIN;
    }
    return now + 3 * MIN;
  }
  if (route.scheduled_departure !== null && now < route.scheduled_departure - 40 * MIN) {
    return Math.min(now + 10 * MIN, Math.max(now + 2 * MIN, route.scheduled_departure - 40 * MIN));
  }
  return now + 2 * MIN;
}

function iso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

function minutes(ms: number): number {
  return Math.round(ms / MIN);
}

/**
 * The leg as the client reads it: the schedule, and what the stored state
 * says on top of it. Without a state the schedule alone answers: scheduled
 * (the client tells a past one from its times), unknown late in the window.
 * After the window nothing is in the air or taxiing any more: such a state
 * reads as unknown.
 */
export function toLiveLeg(leg: ScheduledLeg, state: LiveState | null, now: number): FlightLiveLeg {
  const total = kmTo(leg.origin.lat, leg.origin.lng, leg.destination);
  const span = watchWindow(leg);
  let phase: FlightLivePhase = state?.phase ?? 'scheduled';
  if (!state && leg.scheduled_departure !== null && span && now <= span.end) {
    if (now >= leg.scheduled_departure + UNKNOWN_AFTER_MS) phase = 'unknown';
  }
  if ((phase === 'airborne' || phase === 'taxiing') && windowOver(leg, now)) phase = 'unknown';

  const position = state?.position ?? null;
  const remaining = position
    ? kmTo(position.lat, position.lng, leg.destination)
    : phase === 'landed'
      ? 0
      : phase === 'scheduled' || phase === 'taxiing'
        ? total
        : null;
  const progress = remaining === null || total <= 0 ? null : Math.min(1, Math.max(0, 1 - remaining / total));

  const gs = position?.ground_speed_kt ?? null;
  const estimate =
    phase === 'airborne' && position && remaining !== null && gs !== null && gs > 150
      ? (state?.last_seen_at ?? now) + (remaining / (gs * KT_TO_KMH)) * HOUR + APPROACH_BUFFER_MS
      : null;
  const departedAt = state?.departed_at ?? null;
  const landedAt = state?.landed_at ?? null;
  const arrivalBasis = landedAt ?? estimate;
  const lastSeen = state?.last_seen_at ?? null;

  return {
    reservation_id: leg.reservation_id,
    leg_index: leg.leg_index,
    callsign: leg.callsign,
    flight_number: leg.flight_number,
    service_date: leg.service_date,
    origin: leg.origin,
    destination: leg.destination,
    phase,
    scheduled_departure: iso(leg.scheduled_departure),
    scheduled_arrival: iso(leg.scheduled_arrival),
    departed_at: iso(departedAt),
    landed_at: iso(landedAt),
    estimated_arrival: iso(estimate === null ? null : Math.round(estimate)),
    departure_delay_min:
      departedAt !== null && leg.scheduled_departure !== null ? minutes(departedAt - leg.scheduled_departure) : null,
    arrival_delay_min:
      arrivalBasis !== null && leg.scheduled_arrival !== null ? minutes(arrivalBasis - leg.scheduled_arrival) : null,
    progress,
    distance_total_km: Math.round(total),
    distance_remaining_km: remaining === null ? null : Math.round(remaining),
    position,
    aircraft:
      state && (state.registration || state.aircraft_type)
        ? { registration: state.registration, type: state.aircraft_type }
        : null,
    last_seen_at: iso(lastSeen),
    fetched_at: iso(state?.fetched_at ?? null),
    stale: phase === 'airborne' && lastSeen !== null && now - lastSeen > STALE_AFTER_MS,
    source: state?.source ?? null,
  };
}

/**
 * How late the leg is running at departure, in minutes, when there is
 * evidence of it; else null. Wheels-up says it outright. An aircraft still
 * heard on the ground after the scheduled time is late by at least the time it
 * was last heard, but only while that report is recent: one gone quiet at the
 * gate says nothing about now.
 */
export function departureDelay(leg: ScheduledLeg, state: LiveState, now: number): number | null {
  const scheduled = leg.scheduled_departure;
  if (scheduled === null) return null;
  if (state.departed_at !== null) return minutes(state.departed_at - scheduled);
  const heard = state.last_seen_at;
  if (state.phase !== 'taxiing' || heard === null || heard <= scheduled) return null;
  return now - heard < STALE_AFTER_MS ? minutes(heard - scheduled) : null;
}
