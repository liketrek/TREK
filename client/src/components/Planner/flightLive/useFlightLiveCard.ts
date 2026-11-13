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
  type FlightStage,
} from '../../../utils/flightLiveModel';

type T = ReturnType<typeof useTranslation>['t'];

export interface FlightTimeCell {
  /** The time that counts now: observed, estimated or planned. */
  value: string;
  /** The planned time, only when it differs from `value`, shown struck beside it. */
  planned: string | null;
}

interface FlightStat {
  label: string;
  value: string;
}

interface FlightLiveCard {
  leg: FlightLiveLeg;
  view: FlightLiveView;
  /** Where the flight stands: "Scheduled", "In the air", "Landed". */
  headline: string;
  /** What comes next: "Departs in 2 h 10 min", "Lands in 5 h", or null. */
  detail: string | null;
  /** Both in one line for the strips and plan rows, in the language's own joining. */
  line: string;
  delay: { text: string; tone: DelayTone } | null;
  dep: FlightTimeCell;
  arr: FlightTimeCell;
  stats: FlightStat[];
  /** Who the live data came from, credited quietly on the map once the feed has seen this flight. */
  attribution: string | null;
  /** Around boarding, where a traveller looks for a gate open data does not have. */
  gateHint: boolean;
  /** True while the aircraft is moving. */
  live: boolean;
  /** The colour family of the stage, for the tinted head of the card. */
  tone: 'live' | 'done' | 'planned';
}

/**
 * The current time, ticking every `ms` while `active`, for countdowns that move.
 * Idle without a flight to show, so a booking TREK follows no state for sets
 * no timer at all.
 */
function useNow(ms: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
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

/** The stages a card speaks for; without live data (past, unknown) there is no card. */
type ShownStage = Exclude<FlightStage, 'past' | 'unknown'>;

function headlineOf(
  stage: ShownStage,
  view: FlightLiveView,
  leg: FlightLiveLeg,
  t: T,
  time: (ms: number, tz: string | null) => string
): { headline: string; detail: string | null } {
  switch (stage) {
    case 'upcoming':
    case 'soon':
      return {
        headline: t('flightLive.scheduled'),
        detail:
          view.countdownMs != null ? t('flightLive.departsIn', { time: durationText(view.countdownMs, t) }) : null,
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
  }
}

/** One end's time: what counts now (observed or estimated), the planned one beside it when they differ. */
function timeCell(
  actual: number | null,
  planned: number | null,
  tz: string | null,
  time: (ms: number, tz: string | null) => string
): FlightTimeCell {
  const shown = actual ?? planned;
  if (shown == null) return { value: '--:--', planned: null };
  const value = time(shown, tz);
  const plannedText = planned != null ? time(planned, tz) : null;
  return { value, planned: actual != null && plannedText !== value ? plannedText : null };
}

const TONE: Record<ShownStage, FlightLiveCard['tone']> = {
  upcoming: 'planned',
  soon: 'planned',
  taxiing: 'live',
  airborne: 'live',
  landed: 'done',
};

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

/** In the air and on the ground the arrival delay counts, before take-off the departure delay. */
function delayOf(view: FlightLiveView, t: T): { text: string; tone: DelayTone } | null {
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
  const now = useNow(30_000, !!leg);
  if (!leg) return null;

  const view = flightLiveView(leg, now);
  // No live data to show: the flight is long over, or the feed never heard it. Nothing at all then.
  if (view.stage === 'past' || view.stage === 'unknown') return null;
  const time = (ms: number, tz: string | null) => airportTime(ms, tz, locale, timeFormat);
  const { headline, detail } = headlineOf(view.stage, view, leg, t, time);
  return {
    leg,
    view,
    headline,
    detail,
    line: detail && view.stage === 'airborne' ? t('flightLive.headlineDetail', { headline, detail }) : headline,
    delay: delayOf(view, t),
    dep: timeCell(view.depActual, view.depPlanned, leg.origin.timezone, time),
    arr: timeCell(view.arrExpected, view.arrPlanned, leg.destination.timezone, time),
    stats: statsOf(leg, view, imperial, locale, t),
    // The feed is credited only for data it gave.
    attribution: leg.last_seen_at ? attribution : null,
    gateHint: view.stage === 'soon' || view.stage === 'taxiing',
    live: view.stage === 'airborne' || view.stage === 'taxiing',
    tone: TONE[view.stage],
  };
}

/**
 * The leg a one-line summary of a booking speaks for (see currentLeg), as a
 * leg index, or null while TREK follows none of its legs.
 */
export function useCurrentFlightLegIndex(tripId: number, reservationId: number): number | null {
  const legs = useFlightLiveLegs(tripId, reservationId);
  const now = useNow(60_000, legs.length > 0);
  return currentLeg(legs, now)?.leg_index ?? null;
}
