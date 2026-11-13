import type { FlightLiveLeg } from '@trek/shared';

/**
 * What a live flight card shows, worked out from one leg's state and the clock.
 * Pure on purpose: the desktop dialog, the mobile sheet, the plan rows and the
 * home-screen widget snapshot all read the same view, so a flight never says
 * "in the air" in one place and "departs in 5 min" in another.
 */

/**
 * - upcoming: departure more than three hours away.
 * - soon:     within three hours of departure, nothing seen yet.
 * - taxiing:  seen on the ground at the departure airport.
 * - airborne: in the air.
 * - landed:   on the ground at the destination.
 * - past:     the schedule is over and the feed never confirmed the flight.
 * - unknown:  the departure time has passed and the callsign never showed up.
 */
type FlightStage = 'upcoming' | 'soon' | 'taxiing' | 'airborne' | 'landed' | 'past' | 'unknown';

/** ok: on time or early; minor: up to half an hour; major: more. */
export type DelayTone = 'ok' | 'minor' | 'major';

export interface FlightLiveView {
  stage: FlightStage;
  /** Share of the way flown, 0 to 1, for placing the aircraft on the arc. */
  progress: number;
  depPlanned: number | null;
  /** Observed wheels-up. */
  depActual: number | null;
  arrPlanned: number | null;
  /** Touchdown once landed, the estimate while flying, else null. */
  arrExpected: number | null;
  arrIsEstimate: boolean;
  depDelay: number | null;
  arrDelay: number | null;
  /** Milliseconds to departure (before take-off) or to arrival (in the air). */
  countdownMs: number | null;
  /** The feed has heard this aircraft at least once. */
  heard: boolean;
  stale: boolean;
}

const SOON_MS = 3 * 60 * 60 * 1000;
const PAST_MS = 60 * 60 * 1000;
const KEEP_LANDED_MS = 6 * 60 * 60 * 1000;

export const toMs = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export function delayTone(minutes: number | null): DelayTone {
  if (minutes == null || minutes <= 5) return 'ok';
  return minutes < 30 ? 'minor' : 'major';
}

function stageOf(leg: FlightLiveLeg, now: number, depPlanned: number | null, arrPlanned: number | null): FlightStage {
  // A landing, or a flight never heard, says nothing anymore hours after its arrival.
  const end = toMs(leg.landed_at) ?? arrPlanned;
  if ((leg.phase === 'landed' || leg.phase === 'unknown') && end != null && now > end + KEEP_LANDED_MS) return 'past';
  switch (leg.phase) {
    case 'taxiing':
    case 'airborne':
    case 'landed':
    case 'unknown':
      return leg.phase;
    case 'scheduled':
      if (arrPlanned != null && now > arrPlanned + PAST_MS) return 'past';
      if (depPlanned != null && depPlanned - now <= SOON_MS) return 'soon';
      return 'upcoming';
  }
}

export function flightLiveView(leg: FlightLiveLeg, now: number): FlightLiveView {
  const depPlanned = toMs(leg.scheduled_departure);
  const arrPlanned = toMs(leg.scheduled_arrival);
  const depActual = toMs(leg.departed_at);
  const landedAt = toMs(leg.landed_at);
  const estimate = toMs(leg.estimated_arrival);
  const stage = stageOf(leg, now, depPlanned, arrPlanned);

  const arrExpected = landedAt ?? (stage === 'airborne' ? estimate : null);
  const arrIsEstimate = landedAt == null && arrExpected != null;

  let progress = 0;
  if (stage === 'landed' || stage === 'past') progress = 1;
  else if (stage === 'airborne') {
    if (leg.progress != null) progress = leg.progress;
    else {
      // No position to measure by (stale over an ocean): place it by the clock.
      const start = depActual ?? depPlanned;
      const end = arrExpected ?? arrPlanned;
      if (start != null && end != null && end > start) progress = clamp01((now - start) / (end - start));
    }
  }

  let countdownMs: number | null = null;
  if ((stage === 'upcoming' || stage === 'soon') && depPlanned != null) countdownMs = Math.max(0, depPlanned - now);
  if (stage === 'airborne') {
    const end = arrExpected ?? arrPlanned;
    if (end != null) countdownMs = Math.max(0, end - now);
  }

  return {
    stage,
    progress: clamp01(progress),
    depPlanned,
    depActual,
    arrPlanned,
    arrExpected,
    arrIsEstimate,
    depDelay: leg.departure_delay_min,
    arrDelay: leg.arrival_delay_min,
    countdownMs,
    heard: leg.last_seen_at != null,
    stale: leg.stale,
  };
}

/** Whole hours and minutes of a duration, rounded up to the next minute. */
export function splitDuration(ms: number): { days: number; hours: number; minutes: number } {
  const total = Math.ceil(ms / 60_000);
  return { days: Math.floor(total / 1440), hours: Math.floor((total % 1440) / 60), minutes: total % 60 };
}

/** Clock time at an airport, in the user's 12/24 h preference. */
export function airportTime(ms: number, timezone: string | null, locale: string, timeFormat: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h',
      timeZone: timezone || undefined,
    }).format(ms);
  } catch {
    // An unknown zone name from an old booking: the device zone is a better answer than none.
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h' }).format(
      ms
    );
  }
}

/**
 * The leg of a multi-leg booking a one-line summary should speak for: the one
 * in the air or on the ground about to leave, else the next one ahead, else
 * the last one. Null when nothing is followed.
 */
export function currentLeg(legs: FlightLiveLeg[], now: number): FlightLiveLeg | null {
  if (legs.length === 0) return null;
  const moving = legs.find((leg) => leg.phase === 'airborne' || leg.phase === 'taxiing');
  if (moving) return moving;
  const ahead = legs.find((leg) => {
    const arr = toMs(leg.landed_at) ?? toMs(leg.scheduled_arrival);
    return leg.phase !== 'landed' && (arr == null || arr > now);
  });
  return ahead ?? legs[legs.length - 1];
}
