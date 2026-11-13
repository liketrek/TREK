import type { FlightLiveLeg } from '@trek/shared';
import { airportTime, toMs } from '../utils/flightLiveModel';

/**
 * The flight a home-screen widget follows: the trip's next one or the one in
 * the air. Times go along as epoch seconds so the widget moves its countdown
 * and its aircraft on with the clock between two snapshots; the clock times
 * at either airport go along formatted, since the widget has no zone data.
 * Optional on the native side (WidgetSnapshot.swift, WidgetSnapshot.kt): an
 * older app binary ignores it.
 */
export interface WidgetFlight {
  number: string;
  from: string;
  to: string;
  fromCity?: string;
  toCity?: string;
  /** Planned departure and arrival, epoch seconds. */
  dep: number;
  arr: number;
  /** Observed take-off, epoch seconds. */
  depActual?: number;
  /** Before take-off: the planned departure plus the delay seen so far, epoch seconds. */
  depExpected?: number;
  /** The feed sees the aircraft in the air right now. */
  airborne?: boolean;
  /** Touchdown once landed, else the estimate while in the air, epoch seconds. */
  arrExpected?: number;
  landed?: boolean;
  /** Clock times at the airports: planned departure, planned arrival, expected arrival. */
  depTime: string;
  arrTime: string;
  arrTimeExpected?: string;
  /** Minutes late against the schedule (negative when early). */
  delay?: number;
  /** "A359 D-AIXA". */
  aircraft?: string;
  /** When the feed last heard the aircraft, epoch seconds. */
  seen?: number;
  path: string;
}

/** How long after landing the widget keeps the flight before moving on to the next. */
const KEEP_AFTER_LANDING_S = 2 * 60 * 60;
/** How far ahead a flight is worth the widget's attention. */
const LOOK_AHEAD_S = 7 * 24 * 60 * 60;

const sec = (ms: number | null): number | undefined => (ms == null ? undefined : Math.round(ms / 1000));

/**
 * The leg to show: one in the air or rolling first, else the earliest whose
 * arrival (with two hours' grace) is still ahead and that departs within a week.
 */
export function pickWidgetLeg(legs: FlightLiveLeg[], nowMs: number): FlightLiveLeg | null {
  const now = nowMs / 1000;
  const arrivalOf = (l: FlightLiveLeg) =>
    sec(toMs(l.landed_at) ?? toMs(l.estimated_arrival) ?? toMs(l.scheduled_arrival));
  // A leg the feed lost in the air still counts only until two hours after its arrival.
  const moving = legs.find((l) => {
    const arr = arrivalOf(l);
    return (l.phase === 'airborne' || l.phase === 'taxiing') && (arr == null || arr + KEEP_AFTER_LANDING_S > now);
  });
  if (moving) return moving;
  return (
    legs
      .filter((l) => {
        const dep = sec(toMs(l.scheduled_departure));
        const arr = sec(toMs(l.landed_at) ?? toMs(l.scheduled_arrival));
        return dep != null && arr != null && arr + KEEP_AFTER_LANDING_S > now && dep - now < LOOK_AHEAD_S;
      })
      .sort((a, b) => (toMs(a.scheduled_departure) ?? 0) - (toMs(b.scheduled_departure) ?? 0))[0] ?? null
  );
}

export function widgetFlight(
  legs: FlightLiveLeg[],
  nowMs: number,
  tripPath: string,
  clock: { locale: string; timeFormat: string }
): WidgetFlight | undefined {
  const leg = pickWidgetLeg(legs, nowMs);
  const dep = leg ? toMs(leg.scheduled_departure) : null;
  const arr = leg ? toMs(leg.scheduled_arrival) : null;
  if (!leg || dep == null || arr == null) return undefined;
  const time = (ms: number, tz: string | null) => airportTime(ms, tz, clock.locale, clock.timeFormat);
  const landed = toMs(leg.landed_at);
  const expected = landed ?? (leg.phase === 'airborne' ? toMs(leg.estimated_arrival) : null);
  const aircraft = [leg.aircraft?.type, leg.aircraft?.registration].filter(Boolean).join(' ');
  const delay = leg.arrival_delay_min ?? leg.departure_delay_min;
  return {
    number: leg.flight_number,
    from: leg.origin.code,
    to: leg.destination.code,
    ...(leg.origin.name ? { fromCity: leg.origin.name } : {}),
    ...(leg.destination.name ? { toCity: leg.destination.name } : {}),
    dep: Math.round(dep / 1000),
    arr: Math.round(arr / 1000),
    ...(leg.departed_at ? { depActual: sec(toMs(leg.departed_at)) } : {}),
    ...(!leg.departed_at && leg.departure_delay_min != null && leg.departure_delay_min > 0
      ? { depExpected: Math.round(dep / 1000) + leg.departure_delay_min * 60 }
      : {}),
    ...(leg.phase === 'airborne' ? { airborne: true } : {}),
    ...(expected != null
      ? { arrExpected: sec(expected), arrTimeExpected: time(expected, leg.destination.timezone) }
      : {}),
    ...(landed != null ? { landed: true } : {}),
    depTime: time(dep, leg.origin.timezone),
    arrTime: time(arr, leg.destination.timezone),
    ...(delay != null ? { delay } : {}),
    ...(aircraft ? { aircraft } : {}),
    ...(leg.last_seen_at ? { seen: sec(toMs(leg.last_seen_at)) } : {}),
    path: `${tripPath}?booking=${leg.reservation_id}`,
  };
}
