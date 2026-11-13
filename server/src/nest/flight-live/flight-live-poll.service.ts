import { FlightLiveStates } from '../../db/entities/FlightLiveStates.entity';
import type {
  FlightLiveStatesRepository,
  FlightLiveStateWrite,
} from '../../db/repositories/FlightLiveStates.repository';
import { dbNow, type DbTimestamp } from '../../db/types';
import { logDebug, logError } from '../audit/audit-log.logger';
import { NotificationsService, type NotificationPayload } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  advance,
  closeIfOver,
  departureDelay,
  emptyState,
  failed,
  inWatchWindow,
  nextPollAt,
  pickAircraft,
  toLiveLeg,
  watchWindow,
  type LiveState,
} from './flight-live.derive';
import { FlightLiveFeedService, type FeedLookup } from './flight-live.feeds';
import { FlightLiveService, legKey, type TripLeg } from './flight-live.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

type NotifEventType = NotificationPayload['event'];

const DAY_MS = 24 * 60 * 60 * 1000;
/** A delay worth telling the travellers about, in minutes. */
const DELAY_NOTICE_MIN = 15;
/** A client's refresh brings a flight forward only when it is due within this anyway. */
const REFRESH_AHEAD_MS = 2 * 60 * 1000;
/** At most this many feed requests in one tick (a minute); the hourly budget is the real limit. */
const MAX_REQUESTS_PER_TICK = 20;
/** States of flights that departed longer ago are dropped. */
const KEEP_DAYS = 30;

interface PollResult {
  asked: number;
  changed: number;
  skipped: 'disabled' | 'running' | null;
}

function ts(ms: number | null): DbTimestamp | null {
  return ms === null ? null : dbNow(new Date(ms));
}

function toWrite(state: LiveState): FlightLiveStateWrite {
  const p = state.position;
  return {
    callsign: state.callsign,
    service_date: state.service_date,
    origin: state.origin,
    destination: state.destination,
    phase: state.phase,
    departed_at: ts(state.departed_at),
    landed_at: ts(state.landed_at),
    lat: p?.lat ?? null,
    lng: p?.lng ?? null,
    altitude_ft: p?.altitude_ft ?? null,
    ground_speed_kt: p?.ground_speed_kt ?? null,
    track_deg: p?.track_deg ?? null,
    vertical_rate_fpm: p?.vertical_rate_fpm ?? null,
    on_ground: p ? (p.on_ground ? 1 : 0) : null,
    registration: state.registration,
    aircraft_type: state.aircraft_type,
    source: state.source,
    first_seen_at: ts(state.first_seen_at),
    last_seen_at: ts(state.last_seen_at),
    fetched_at: ts(state.fetched_at),
    next_poll_at: ts(state.next_poll_at),
    fail_count: state.fail_count,
    departed_notified: state.departed_notified ? 1 : 0,
    landed_notified: state.landed_notified ? 1 : 0,
    delay_notified: state.delay_notified ? 1 : 0,
  };
}

/** What a client sees of a state; a poll that changed none of it is not broadcast. */
function visible(state: LiveState): string {
  return JSON.stringify([
    state.phase,
    state.departed_at,
    state.landed_at,
    state.position,
    state.registration,
    state.aircraft_type,
    state.last_seen_at,
  ]);
}

/** The local date `days` away from `now`'s UTC date. */
function utcDate(now: number, days: number): string {
  return new Date(now + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The poll behind live flight status, one tick a minute (FlightLiveJob).
 *
 * It reads every flight leg in its watch window across all trips, asks the
 * feed once per flight (callsign and departure day) that is due by its
 * cadence or that a client asked to refresh, within the instance's budget,
 * stores what changed, sends it to every trip holding the flight and tells
 * the travellers when the flight departs, lands or runs late.
 */
@Injectable()
export class FlightLivePollService {
  private running = false;
  private lastPurgeDay: string | null = null;
  /** Waits between two requests; a test hands in one that does not. */
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  constructor(
    @InjectRepository(FlightLiveStates) private readonly states: FlightLiveStatesRepository,
    private readonly live: FlightLiveService,
    private readonly feeds: FlightLiveFeedService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * One tick. A second call while one runs returns at once.
   *
   * @txIndependent every flight's state is one write of its own, with network
   * I/O between them; a tick cut short keeps what it stored.
   */
  async poll(clock: () => number = Date.now): Promise<PollResult> {
    if (this.running) return { asked: 0, changed: 0, skipped: 'running' };
    this.running = true;
    try {
      if (!(await this.live.isEnabled())) return { asked: 0, changed: 0, skipped: 'disabled' };
      await this.purge(clock());
      return await this.pollDue(clock);
    } finally {
      this.running = false;
    }
  }

  private async purge(now: number): Promise<void> {
    const today = utcDate(now, 0);
    if (this.lastPurgeDay === today) return;
    this.lastPurgeDay = today;
    const dropped = await this.states.deleteBefore(utcDate(now, -KEEP_DAYS));
    if (dropped > 0) logDebug(`[flight-live] dropped ${dropped} old flight states`);
  }

  /**
   * @txIndependent one write per flight, with a feed request and the notices
   * between them; a flight stored stays stored if a later one fails.
   */
  private async pollDue(clock: () => number): Promise<PollResult> {
    const now = clock();
    const bookings = await this.states.listFlightBookingsBetween(utcDate(now, -2), utcDate(now, 2));
    const loaded = await this.live.loadLegs(bookings);
    const stored = await this.live.statesFor(loaded);
    await this.closeEnded(loaded, stored, now);
    const groups = new Map<string, TripLeg[]>();
    for (const leg of loaded.filter((l) => inWatchWindow(l, now))) {
      groups.set(legKey(leg), [...(groups.get(legKey(leg)) ?? []), leg]);
    }
    const requested = this.live.takeRefreshRequests(now);
    const due = [...groups.keys()]
      .map((key) => ({ key, state: stored.get(key) ?? null }))
      .filter(({ key, state }) => {
        if (state?.phase === 'landed') return false;
        if (!state || state.next_poll_at === null) return true;
        // A client's ask may bring a flight forward a little, never past its cadence or a back-off.
        const ahead = requested.has(key) ? REFRESH_AHEAD_MS : 0;
        return state.next_poll_at - ahead <= now;
      })
      .sort(
        (a, b) =>
          Number(requested.has(b.key)) - Number(requested.has(a.key)) ||
          (a.state?.next_poll_at ?? 0) - (b.state?.next_poll_at ?? 0),
      );

    const queue = due.slice(0, MAX_REQUESTS_PER_TICK).map(({ key, state }) => ({ legs: groups.get(key) ?? [], state }));
    const result: PollResult = { asked: 0, changed: 0, skipped: null };
    await this.pollEach(queue, clock, result);
    return result;
  }

  /**
   * Closes every flight whose window ended while it was still taxiing or in
   * the air: stored as unknown with no next poll, and sent to its trips.
   *
   * @txIndependent one write per closed flight; each stands on its own.
   */
  private async closeEnded(legs: readonly TripLeg[], stored: Map<string, LiveState>, now: number): Promise<void> {
    const ended = new Map<string, TripLeg[]>();
    for (const leg of legs) {
      const span = watchWindow(leg);
      if (span !== null && now > span.end) ended.set(legKey(leg), [...(ended.get(legKey(leg)) ?? []), leg]);
    }
    await [...ended].reduce(async (previous, [key, flightLegs]) => {
      await previous;
      const state = stored.get(key);
      const route = flightLegs[0];
      if (!state || !route) return;
      const closed = closeIfOver(state, route, now);
      if (closed === state) return;
      stored.set(key, closed);
      await this.states.saveState(toWrite(closed));
      this.broadcast(flightLegs, closed, now);
    }, Promise.resolve());
  }

  /**
   * Asks about the flights one after the other, waiting out the feed spacing
   * between them, until the queue or the budget runs out.
   *
   * @txIndependent one write per flight (pollDue).
   */
  private async pollEach(
    queue: ReadonlyArray<{ legs: TripLeg[]; state: LiveState | null }>,
    clock: () => number,
    result: PollResult,
  ): Promise<void> {
    const [head, ...rest] = queue;
    const route = head?.legs[0];
    if (!head || !route) return;
    const wait = this.feeds.waitMs(clock());
    if (wait > 0) await this.sleep(wait);
    if (!this.feeds.canAsk(clock())) return;
    const prev =
      head.state ?? emptyState(route.callsign, route.service_date, route.origin.code, route.destination.code);
    const answer = await this.feeds.lookup(route.callsign, clock);
    // Spelled out: without strictNullChecks `ok` alone does not narrow the union.
    if (!answer.ok && (answer as Extract<FeedLookup, { ok: false }>).reason === 'budget') return;
    result.asked++;
    const at = clock();
    let next = answer.ok ? advance(prev, pickAircraft(answer.aircraft, route), route, at, answer.source) : failed(prev);
    next = closeIfOver({ ...next, next_poll_at: nextPollAt(next, route, at) }, route, at);
    const notices = this.dueNotices(prev, next, head.legs, at);
    next = { ...next, ...notices.flags };
    await this.states.saveState(toWrite(next));
    if (visible(prev) !== visible(next)) {
      result.changed++;
      this.broadcast(head.legs, next, at);
    }
    await this.announce(notices.events, head.legs, next, at);
    await this.pollEach(rest, clock, result);
  }

  /** The notices this poll owes the travellers, each at most once per flight, and the flags that record them. */
  private dueNotices(
    prev: LiveState,
    next: LiveState,
    legs: readonly TripLeg[],
    now: number,
  ): { events: NotifEventType[]; flags: Pick<LiveState, 'departed_notified' | 'landed_notified' | 'delay_notified'> } {
    const events: NotifEventType[] = [];
    const flags = {
      departed_notified: prev.departed_notified,
      landed_notified: prev.landed_notified,
      delay_notified: prev.delay_notified,
    };
    const delays = legs.map((leg) => departureDelay(leg, next, now)).filter((d): d is number => d !== null);
    if (!flags.delay_notified && delays.some((d) => d >= DELAY_NOTICE_MIN)) {
      events.push('flight_delayed');
      flags.delay_notified = true;
    }
    if (!flags.departed_notified && next.phase === 'airborne') {
      events.push('flight_departed');
      flags.departed_notified = true;
    }
    if (!flags.landed_notified && next.phase === 'landed') {
      events.push('flight_landed');
      flags.landed_notified = true;
      // Seen only once it was down: departing now would be news from the past.
      flags.departed_notified = true;
    }
    return { events, flags };
  }

  /** The changed flight to every trip holding one of its legs, as the client reads it. */
  private broadcast(legs: readonly TripLeg[], state: LiveState, now: number): void {
    const byTrip = new Map<number, TripLeg[]>();
    for (const leg of legs) byTrip.set(leg.trip_id, [...(byTrip.get(leg.trip_id) ?? []), leg]);
    for (const [tripId, tripLegs] of byTrip) {
      this.realtime.broadcast(tripId, 'flight:live', { flights: tripLegs.map((leg) => toLiveLeg(leg, state, now)) });
    }
  }

  /**
   * Each notice to the travellers of each booking holding the flight, or to
   * the whole trip when nobody is put on the booking.
   *
   * @txStandalone a notice stands on its own; the state that records it is already stored.
   */
  private async announce(
    events: readonly NotifEventType[],
    legs: readonly TripLeg[],
    state: LiveState,
    now: number,
  ): Promise<void> {
    if (events.length === 0) return;
    // One leg after the other, as every other sender in the codebase does: a notice writes its rows.
    await legs.reduce(async (previous, leg) => {
      await previous;
      const params: Record<string, string> = {
        flight: leg.flight_number,
        from: leg.origin.code,
        to: leg.destination.code,
        trip: leg.trip_title,
        tripId: String(leg.trip_id),
        delay: String(Math.max(0, departureDelay(leg, state, now) ?? 0)),
      };
      try {
        const travelers = await this.states.listTravelerIds(leg.reservation_id);
        const targets: Array<{ scope: 'trip' | 'user'; targetId: number }> =
          travelers.length === 0
            ? [{ scope: 'trip', targetId: leg.trip_id }]
            : travelers.map((userId) => ({ scope: 'user', targetId: userId }));
        const sends = events.flatMap((event) => targets.map((target) => ({ event, ...target })));
        await sends.reduce(async (sent, payload) => {
          await sent;
          await this.notifications.send({ ...payload, actorId: null, params });
        }, Promise.resolve());
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logError(`[flight-live] notice for ${leg.callsign}: ${reason}`);
      }
    }, Promise.resolve());
  }
}
