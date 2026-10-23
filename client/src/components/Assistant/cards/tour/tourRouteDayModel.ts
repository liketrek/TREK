import type { TourRouteCard, TourRouteSchedule } from '@trek/shared';

/**
 * A tour's day as its card draws it, pure: where the daylight and the walk
 * lie on one bar (and the parts of the walk out in the dark), which hours of
 * the forecast to show, and the time on the way at a spot of it.
 */

const DAY_MINUTES = 24 * 60;
/** From which likelihood of rain an hour shows its drop. */
export const RAIN_SHOWN_PCT = 30;

/** Minutes after midnight of an `HH:MM` clock. */
export function clockMinutes(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** The `HH:MM` clock `minutes` after `clock`, past midnight round again. */
export function clockAfter(clock: string, minutes: number): string {
  const total = (((clockMinutes(clock) + Math.round(minutes)) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** A stretch of the bar, as shares of its length in percent. */
export interface BarSpan {
  start: number;
  size: number;
}

/** The day's bar: the daylight, the walk, the parts of the walk in the dark, each placed on the hours shown. */
interface DayBar {
  daylight: BarSpan | null;
  walk: BarSpan | null;
  dark: BarSpan[];
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The bar of a scheduled day, from an hour before the first thing it shows
 * to an hour after the last (the sun, the start, the arrival), so the walk
 * reads against the daylight. An arrival past midnight lies on the next day.
 * Null when the day knows neither the sun nor a start.
 */
export function dayBarOf(schedule: TourRouteSchedule): DayBar | null {
  const { sunrise, sunset, start, arrive } = barClocks(schedule);
  const known = [sunrise, sunset, start, arrive].filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  const from = Math.max(0, Math.floor(Math.min(...known) / 60) * 60 - 60);
  const to = Math.min(2 * DAY_MINUTES, Math.ceil(Math.max(...known) / 60) * 60 + 60);
  const span = (a: number, b: number): BarSpan => ({
    start: round(((a - from) / (to - from)) * 100),
    size: round(((b - a) / (to - from)) * 100),
  });
  const daylight = sunrise !== null && sunset !== null && sunset > sunrise ? span(sunrise, sunset) : null;
  const walk = start !== null && arrive !== null && arrive > start ? span(start, arrive) : null;
  const dark: BarSpan[] = [];
  if (walk && start !== null && arrive !== null && sunrise !== null && sunset !== null) {
    if (start < sunrise) dark.push(span(start, Math.min(arrive, sunrise)));
    if (arrive > sunset) dark.push(span(Math.max(start, sunset), arrive));
  }
  return { daylight, walk, dark };
}

/** The day's clocks in minutes from its midnight, null where it names none; an arrival past midnight counts on. */
function barClocks(schedule: TourRouteSchedule): {
  sunrise: number | null;
  sunset: number | null;
  start: number | null;
  arrive: number | null;
} {
  const minutesOf = (clock: string | null | undefined) => (clock ? clockMinutes(clock) : null);
  const start = minutesOf(schedule.start);
  let arrive = minutesOf(schedule.arrive);
  if (start !== null && arrive !== null && (schedule.nextDay || arrive < start)) arrive += DAY_MINUTES;
  return { sunrise: minutesOf(schedule.sunrise), sunset: minutesOf(schedule.sunset), start, arrive };
}

/** The forecast's hours to show as cells: only a forecast's, since a climate's are last year's. */
export function forecastHours(schedule: TourRouteSchedule): TourRouteSchedule['hours'] {
  return schedule.weather === 'forecast' ? schedule.hours : [];
}

/**
 * The time on the way at a spot along it, shared out by distance: the clock
 * when the day has a start, else the minutes since setting off. Null for a
 * route without a time or a length.
 */
export function timeAt(card: TourRouteCard, atM: number): { clock: string | null; minutes: number } | null {
  if (card.minutes === null || !card.distanceM) return null;
  const minutes = Math.round(card.minutes * Math.min(1, Math.max(0, atM / card.distanceM)));
  const start = card.schedule?.start ?? null;
  return { clock: start ? clockAfter(start, minutes) : null, minutes };
}
