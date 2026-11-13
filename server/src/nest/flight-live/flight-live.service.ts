import { FlightLiveStates } from '../../db/entities/FlightLiveStates.entity';
import { RESERVATION_METADATA } from '../../db/json-columns';
import type {
  FlightBookingDbRow,
  FlightLiveStateRow,
  FlightLiveStatesRepository,
} from '../../db/repositories/FlightLiveStates.repository';
import { parseDbTimestamp } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { AirportsService } from '../airports/airports.service';
import { SettingsService } from '../settings/settings.service';
import { emptyState, inWatchWindow, toLiveLeg, type LiveState } from './flight-live.derive';
import { FEED_ATTRIBUTION, FlightLiveFeedService } from './flight-live.feeds';
import { legsOfBooking, type FlightEndpointRow, type ScheduledLeg } from './flight-live.schedule';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  flightLivePhaseSchema,
  flightLiveSourceSchema,
  type FlightLiveLeg,
  type FlightLivePosition,
  type TripFlightLiveResponse,
} from '@trek/shared';

/** A stored answer older than this is refreshed when a client asks for an in-window leg. */
const REFRESH_AFTER_MS = 2 * 60 * 1000;
/** A callsign is put up for a refresh at most once a minute, however many clients ask. */
const REFRESH_SPACING_MS = 60 * 1000;

/** The key a flight state is stored under: one per callsign, local departure day and sector. */
export function stateKey(callsign: string, serviceDate: string, origin: string, destination: string): string {
  return `${callsign}|${serviceDate}|${origin}|${destination}`;
}

/** The key of the flight a leg flies. */
export function legKey(leg: Pick<ScheduledLeg, 'callsign' | 'service_date' | 'origin' | 'destination'>): string {
  return stateKey(leg.callsign, leg.service_date, leg.origin.code, leg.destination.code);
}

/** States the poll will not ask about soon: a client asking again must not get around that. */
function backingOff(state: LiveState | null): boolean {
  return state !== null && (state.phase === 'unknown' || state.fail_count >= 3);
}

function ms(ts: string | null): number | null {
  return parseDbTimestamp(ts)?.getTime() ?? null;
}

/** A stored row as the derivation reads it; a value the column should not hold falls back. */
export function rowToState(row: FlightLiveStateRow): LiveState {
  const phase = flightLivePhaseSchema.safeParse(row.phase);
  const source = flightLiveSourceSchema.safeParse(row.source);
  const position: FlightLivePosition | null =
    row.lat !== null && row.lng !== null
      ? {
          lat: row.lat,
          lng: row.lng,
          altitude_ft: row.altitude_ft,
          ground_speed_kt: row.ground_speed_kt,
          track_deg: row.track_deg,
          vertical_rate_fpm: row.vertical_rate_fpm,
          on_ground: row.on_ground === 1,
        }
      : null;
  return {
    ...emptyState(row.callsign, row.service_date, row.origin, row.destination),
    phase: phase.success ? phase.data : 'scheduled',
    departed_at: ms(row.departed_at),
    landed_at: ms(row.landed_at),
    position,
    registration: row.registration,
    aircraft_type: row.aircraft_type,
    source: source.success ? source.data : null,
    first_seen_at: ms(row.first_seen_at),
    last_seen_at: ms(row.last_seen_at),
    fetched_at: ms(row.fetched_at),
    next_poll_at: ms(row.next_poll_at),
    fail_count: row.fail_count,
    departed_notified: row.departed_notified === 1,
    landed_notified: row.landed_notified === 1,
    delay_notified: row.delay_notified === 1,
  };
}

/** A flight leg with the trip it belongs to, for the poll's notices. */
export interface TripLeg extends ScheduledLeg {
  trip_title: string;
}

/**
 * Live flight status for the trips' flight bookings: the read the planner and
 * the MCP tool share, and the leg loading the poll job builds on.
 *
 * The positions come from the open ADS-B feeds (FlightLiveFeedService), asked
 * only by the poll job (FlightLivePollService) within a leg's watch window and
 * kept in `flight_live_states`; a client read never asks a feed itself. A read
 * that finds an in-window leg's answer older than two minutes puts the
 * callsign up for the job's next tick instead.
 */
@Injectable()
export class FlightLiveService {
  /** When each flight was last put up for a refresh, for the once-a-minute throttle. */
  private readonly lastRequested = new Map<string, number>();
  /** The flights waiting for the poll's next tick. */
  private readonly pending = new Set<string>();

  constructor(
    @InjectRepository(FlightLiveStates) private readonly states: FlightLiveStatesRepository,
    private readonly airports: AirportsService,
    private readonly settings: SettingsService,
    private readonly feeds: FlightLiveFeedService,
  ) {}

  /** The admin switch, `flight_live_enabled`, with FLIGHT_LIVE_ENABLED over it; anything but 'false' is on. */
  async isEnabled(): Promise<boolean> {
    return (await this.settings.getResolvedAppSetting('flight_live_enabled')) !== 'false';
  }

  /**
   * Every flight leg of the trip that has a callsign and two known airports,
   * at any date, with its schedule and what the feeds last said about it.
   * The caller has checked that the user may see the trip.
   */
  async tripFlights(tripId: number, now: number = Date.now()): Promise<TripFlightLiveResponse> {
    if (!(await this.isEnabled())) return { enabled: false, attribution: null, flights: [] };
    const legs = await this.loadLegs(await this.states.listFlightBookingsForTrip(tripId));
    const states = await this.statesFor(legs);
    const flights: FlightLiveLeg[] = legs.map((leg) => {
      const state = states.get(legKey(leg)) ?? null;
      if (inWatchWindow(leg, now) && state?.phase !== 'landed' && !backingOff(state)) {
        const fetched = state?.fetched_at ?? null;
        if (fetched === null || now - fetched > REFRESH_AFTER_MS) this.requestRefresh(legKey(leg), now);
      }
      return toLiveLeg(leg, state, now);
    });
    return { enabled: true, attribution: this.attributionFor(flights), flights };
  }

  /** The credit line for what the answer shows: the sources its legs were read from, else the first source. */
  private attributionFor(flights: readonly FlightLiveLeg[]): string {
    const sources = [...new Set(flights.flatMap((f) => (f.source ? [f.source] : [])))].sort();
    if (sources.length === 0) return this.feeds.attribution();
    return sources.map((source) => FEED_ATTRIBUTION[source]).join('; ');
  }

  /** Puts a flight (its {@link legKey}) up for the poll's next tick, at most once a minute. */
  requestRefresh(key: string, now: number): void {
    const last = this.lastRequested.get(key);
    if (last !== undefined && now - last < REFRESH_SPACING_MS) return;
    this.lastRequested.set(key, now);
    this.pending.add(key);
  }

  /** The flights clients asked to refresh since the last call, handed over once. */
  takeRefreshRequests(now: number): Set<string> {
    const wanted = new Set(this.pending);
    this.pending.clear();
    for (const [key, at] of this.lastRequested) {
      if (now - at >= REFRESH_SPACING_MS) this.lastRequested.delete(key);
    }
    return wanted;
  }

  /** The stored states of the legs' flights, by {@link stateKey}. */
  async statesFor(legs: readonly ScheduledLeg[]): Promise<Map<string, LiveState>> {
    const rows = await this.states.findForCallsigns([...new Set(legs.map((leg) => leg.callsign))]);
    const key = (row: FlightLiveStateRow) => stateKey(row.callsign, row.service_date, row.origin, row.destination);
    return new Map(rows.map((row) => [key(row), rowToState(row)]));
  }

  /** The trackable legs of the bookings, each with its trip's title. */
  async loadLegs(bookings: readonly FlightBookingDbRow[]): Promise<TripLeg[]> {
    if (bookings.length === 0) return [];
    const endpoints = await this.states.listEndpoints(bookings.map((b) => b.id));
    const byBooking = new Map<number, FlightEndpointRow[]>();
    for (const endpoint of endpoints) {
      const list = byBooking.get(endpoint.reservation_id) ?? [];
      list.push(endpoint);
      byBooking.set(endpoint.reservation_id, list);
    }
    const decoded = bookings.map((row) => ({
      row,
      metadata: decodeJson(RESERVATION_METADATA, row.metadata, `reservation ${row.id}`),
    }));
    const dayIds = new Set<number>();
    for (const { row, metadata } of decoded) {
      if (row.day_id !== null) dayIds.add(row.day_id);
      if (row.end_day_id !== null) dayIds.add(row.end_day_id);
      const legs = Array.isArray(metadata.legs) ? (metadata.legs as unknown[]) : [];
      for (const leg of legs) {
        if (!leg || typeof leg !== 'object') continue;
        const { dep_day_id: dep, arr_day_id: arr } = leg as Record<string, unknown>;
        if (typeof dep === 'number') dayIds.add(dep);
        if (typeof arr === 'number') dayIds.add(arr);
      }
    }
    const dayDates = new Map((await this.states.listDayDates([...dayIds])).map((d) => [d.id, d.date]));
    const lookup = (code: string) => this.airports.findByIata(code);
    return decoded.flatMap(({ row, metadata }) =>
      legsOfBooking({ ...row, metadata }, byBooking.get(row.id) ?? [], dayDates, lookup).map((leg) => ({
        ...leg,
        trip_title: row.trip_title,
      })),
    );
  }
}
