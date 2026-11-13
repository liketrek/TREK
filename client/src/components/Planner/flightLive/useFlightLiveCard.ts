import type { FlightLiveLeg } from '@trek/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { useFlightLiveAttribution, useFlightLiveLeg, useFlightLiveLegs } from '../../../store/flightLiveStore';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  airportTime,
  currentLeg,
  delayTone,
  flightLiveView,
  splitDuration,
  type DelayTone,
  type FlightLiveView,
} from '../../../utils/flightLiveModel';

type T = ReturnType<typeof useTranslation>['t'];

export interface FlightTimeCell {
  /** The time that counts now: observed, estimated or planned. */
  value: string;
  /** The planned time, only when it differs from `value`. */
  planned: string | null;
  /** Shown under the time: "estimated", "actual" or nothing. */
  note: string | null;
}

interface FlightStat {
  label: string;
  value: string;
}

interface FlightLiveCard {
  leg: FlightLiveLeg;
  view: FlightLiveView;
  /** The big line: "Departs in 2 h 10 min", "In the air", "Landed". */
  headline: string;
  /** The quieter line under it, or null. */
  detail: string | null;
  /** Both in one line for the strips and plan rows, in the language's own joining. */
  line: string;
  delay: { text: string; tone: DelayTone } | null;
  dep: FlightTimeCell;
  arr: FlightTimeCell;
  stats: FlightStat[];
  /** "Updated 2 min ago" with the feed's credit, or null before any data. */
  footnote: string | null;
  attribution: string | null;
  /** Around boarding, where a traveller looks for a gate open data does not have. */
  gateHint: boolean;
  /** True while the aircraft is moving, for the pulsing status dot. */
  live: boolean;
}

/** The current time, ticking every `ms` while mounted, for countdowns that move. */
function useNow(ms: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function durationText(ms: number, t: T): string {
  const { days, hours, minutes } = splitDuration(ms);
  if (days > 0) return t('flightLive.durDaysHours', { d: days, h: hours });
  if (hours > 0) return t('flightLive.durHoursMinutes', { h: hours, m: minutes });
  return t('flightLive.durMinutes', { m: Math.max(1, minutes) });
}

function delayText(minutes: number | null, t: T): { text: string; tone: DelayTone } | null {
  if (minutes == null) return null;
  if (minutes > 5) return { text: t('flightLive.late', { m: minutes }), tone: delayTone(minutes) };
  if (minutes < -5) return { text: t('flightLive.early', { m: -minutes }), tone: 'ok' };
  return { text: t('flightLive.onTime'), tone: 'ok' };
}

function headlineOf(
  view: FlightLiveView,
  leg: FlightLiveLeg,
  t: T,
  time: (ms: number, tz: string | null) => string
): { headline: string; detail: string | null } {
  switch (view.stage) {
    case 'upcoming':
    case 'soon':
      return {
        headline:
          view.countdownMs != null
            ? t('flightLive.departsIn', { time: durationText(view.countdownMs, t) })
            : t('flightLive.scheduled'),
        detail: view.stage === 'soon' ? t('flightLive.watching') : null,
      };
    case 'taxiing':
      return { headline: t('flightLive.taxiing'), detail: t('flightLive.atAirport', { code: leg.origin.code }) };
    case 'airborne':
      return {
        headline: t('flightLive.airborne'),
        detail: view.countdownMs != null ? t('flightLive.landsIn', { time: durationText(view.countdownMs, t) }) : null,
      };
    case 'landed':
      return {
        headline: t('flightLive.landed'),
        detail:
          view.arrExpected != null
            ? t('flightLive.landedAt', {
                time: time(view.arrExpected, leg.destination.timezone),
                code: leg.destination.code,
              })
            : null,
      };
    case 'past':
      return { headline: t('flightLive.over'), detail: null };
    case 'unknown':
      return { headline: t('flightLive.noSignal'), detail: t('flightLive.noSignalHint') };
  }
}

function timeCell(
  actual: number | null,
  planned: number | null,
  tz: string | null,
  estimate: boolean,
  time: (ms: number, tz: string | null) => string,
  t: T
): FlightTimeCell {
  const shown = actual ?? planned;
  if (shown == null) return { value: '--:--', planned: null, note: null };
  const value = time(shown, tz);
  const plannedText = planned != null ? time(planned, tz) : null;
  return {
    value,
    planned: actual != null && plannedText !== value ? plannedText : null,
    note: actual == null ? null : estimate ? t('flightLive.estimated') : t('flightLive.actual'),
  };
}

/** Altitude, speed and distance in the user's units while in the air, and the aircraft when known. */
function statsOf(leg: FlightLiveLeg, view: FlightLiveView, imperial: boolean, locale: string, t: T): FlightStat[] {
  const stats: FlightStat[] = [];
  const pos = view.stage === 'airborne' ? leg.position : null;
  const n = (value: number) => Math.round(value).toLocaleString(locale);
  if (pos?.altitude_ft != null) {
    const value = imperial
      ? t('flightLive.feet', { n: n(pos.altitude_ft) })
      : t('flightLive.meters', { n: n(pos.altitude_ft * 0.3048) });
    stats.push({ label: t('flightLive.altitude'), value });
  }
  if (pos?.ground_speed_kt != null) {
    const value = imperial
      ? t('flightLive.mph', { n: n(pos.ground_speed_kt * 1.15078) })
      : t('flightLive.kmh', { n: n(pos.ground_speed_kt * 1.852) });
    stats.push({ label: t('flightLive.speed'), value });
  }
  if (view.stage === 'airborne' && leg.distance_remaining_km != null) {
    const km = leg.distance_remaining_km;
    stats.push({
      label: t('flightLive.remaining'),
      value: imperial ? t('flightLive.mi', { n: n(km / 1.609344) }) : t('flightLive.km', { n: n(km) }),
    });
  }
  const aircraft = [leg.aircraft?.type, leg.aircraft?.registration].filter(Boolean).join(' ');
  if (aircraft) stats.push({ label: t('flightLive.aircraft'), value: aircraft });
  return stats;
}

/** "Updated 2 min ago", or the age of the last signal once it is stale; null before the feed ever heard it. */
function footnoteOf(leg: FlightLiveLeg, view: FlightLiveView, now: number, t: T): string | null {
  if (!leg.last_seen_at) return null;
  const age = now - Date.parse(leg.last_seen_at);
  return view.stale
    ? t('flightLive.lastSignal', { time: durationText(age, t) })
    : t('flightLive.updated', { time: durationText(Math.max(60_000, age), t) });
}

/** In the air and on the ground the arrival delay counts, before take-off the departure delay. */
function delayOf(view: FlightLiveView, t: T): { text: string; tone: DelayTone } | null {
  if (view.stage === 'past' || view.stage === 'unknown') return null;
  const flying = view.stage === 'airborne' || view.stage === 'landed';
  return delayText(flying ? (view.arrDelay ?? view.depDelay) : view.depDelay, t);
}

/**
 * Everything a live flight card shows for one leg, or null while TREK has no
 * state for it (the feature switched off, an airline it cannot map, a server
 * without the feature). Desktop and phone call this and only lay it out.
 */
export function useFlightLiveCard(tripId: number, reservationId: number, legIndex: number): FlightLiveCard | null {
  const { t, locale } = useTranslation();
  const timeFormat = useSettingsStore((s) => s.settings.time_format) || '24h';
  const imperial = useSettingsStore((s) => s.settings.distance_unit) === 'imperial';
  const leg = useFlightLiveLeg(tripId, reservationId, legIndex);
  const attribution = useFlightLiveAttribution(tripId);
  // A second-level countdown is noise; the minute tick is what a traveller reads.
  const now = useNow(30_000);
  if (!leg) return null;

  const view = flightLiveView(leg, now);
  const time = (ms: number, tz: string | null) => airportTime(ms, tz, locale, timeFormat);
  const { headline, detail } = headlineOf(view, leg, t, time);
  const footnote = footnoteOf(leg, view, now, t);
  return {
    leg,
    view,
    headline,
    detail,
    line: detail && view.stage === 'airborne' ? t('flightLive.headlineDetail', { headline, detail }) : headline,
    delay: delayOf(view, t),
    dep: timeCell(view.depActual, view.depPlanned, leg.origin.timezone, false, time, t),
    arr: timeCell(view.arrExpected, view.arrPlanned, leg.destination.timezone, view.arrIsEstimate, time, t),
    stats: statsOf(leg, view, imperial, locale, t),
    footnote,
    // The feed is credited only for data it gave.
    attribution: footnote ? attribution : null,
    gateHint: view.stage === 'soon' || view.stage === 'taxiing',
    live: view.stage === 'airborne' || view.stage === 'taxiing',
  };
}

/**
 * The leg a one-line summary of a booking speaks for (see currentLeg), as a
 * leg index, or null while TREK follows none of its legs.
 */
export function useCurrentFlightLegIndex(tripId: number, reservationId: number): number | null {
  const legs = useFlightLiveLegs(tripId, reservationId);
  const now = useNow(60_000);
  return currentLeg(legs, now)?.leg_index ?? null;
}
