import { idSchema } from '../common/primitives.schema';
import { clockTimeSchema } from '../place/place-hours';
import type { WeatherResult } from '../weather/weather.schema';

import { z } from 'zod';

/**
 * A hike's day: when it starts and arrives, the sun, the weather by the hour
 * and what to look out for, from the day's detailed weather at one point of
 * the way (its highest where the heights are known). Pure: the server asks the
 * weather and hands it in, the rules are here once.
 *
 * - The arrival is the start plus the walking time; past midnight it is on
 *   the next day.
 * - With a start, the hours run from the one before it to the one after the
 *   arrival. Without one, every second hour of daylight is shown, and the
 *   latest start that still ends half an hour before sunset (none where that
 *   lies before sunrise).
 * - A start before sunrise, an arrival after sunset or within the hour before
 *   it are warned of; so is the first walking hour with a thunderstorm or
 *   rain more likely than not, on a forecast only, since a day further out is
 *   read from last year's weather.
 * - How likely rain is shows only where a forecast says it; a past day,
 *   answered as observed, shows none and warns of no rain.
 * - Without the weather there are no sun times, no hours and no warnings; the
 *   start and the arrival still stand.
 */

/** The most hours a schedule shows; a longer hike shows its first ones. */
export const HIKE_SCHEDULE_HOURS = 18;
/** The most hours of daylight shown for a hike without a start, every second one. */
export const HIKE_DAYLIGHT_HOURS = 8;
/** How long before sunset an arrival is close enough to dusk to be warned of, in minutes. */
export const HIKE_DUSK_MINUTES = 60;
/** How long before sunset the latest start has a hike back, in minutes. */
export const HIKE_SUNSET_MARGIN_MINUTES = 30;
/** How likely rain is, in percent, before a walking hour warns of it. */
export const HIKE_RAIN_PCT = 60;
/** The weather a schedule warns of: thunderstorms, rain, an end after dark, a start before light, an end at dusk. */
export const HIKE_WARNING_KINDS = ['thunder', 'rain', 'dark_end', 'dark_start', 'dusk'] as const;

const MINUTES_A_DAY = 24 * 60;

export const hikeScheduleHourSchema = z.object({
  hour: z.number().int().min(0).max(23),
  /** The hour's weather in one word, as the weather of a day names it (Clear, Rain, Thunderstorm). */
  main: z.string(),
  temp_c: z.number().int(),
  /** Null where the day's weather knows no likelihood: last year's weather, or a past day as observed. */
  rain_pct: z.number().int().min(0).max(100).nullable(),
  wind_kmh: z.number().int().nonnegative().nullable(),
});
export type HikeScheduleHour = z.infer<typeof hikeScheduleHourSchema>;

export const hikeScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** The trip's day the hike is planned on; null where only a date was given. */
  day_id: idSchema.nullable(),
  start: clockTimeSchema.nullable(),
  arrive: clockTimeSchema.nullable(),
  /** The arrival falls on the day after the start. */
  next_day: z.boolean(),
  sunrise: clockTimeSchema.nullable(),
  sunset: clockTimeSchema.nullable(),
  /** Without a start: the latest one that ends half an hour before sunset; null where none does. */
  latest_start: clockTimeSchema.nullable(),
  /** A forecast, last year's weather for a day further out (climate), or none to be had. */
  weather: z.enum(['forecast', 'climate']).nullable(),
  hours: z.array(hikeScheduleHourSchema).max(HIKE_SCHEDULE_HOURS),
});
export type HikeSchedule = z.infer<typeof hikeScheduleSchema>;

export const hikeWarningSchema = z.object({
  kind: z.enum(HIKE_WARNING_KINDS),
  /** The clock it is about: the first such hour, or the sunrise or sunset passed. */
  at: clockTimeSchema.nullable(),
});
export type HikeWarning = z.infer<typeof hikeWarningSchema>;

export interface HikeScheduleInput {
  date: string;
  dayId: number | null;
  /** HH:MM, or null where the hike has no start yet. */
  start: string | null;
  /** The walking time. */
  minutes: number;
  /** The day's detailed weather, or null where it could not be had. */
  weather: WeatherResult | null;
}

/** Minutes after midnight of a clock, null where it is no clock. */
function minutesOf(clock: string | null | undefined): number | null {
  if (!clock || !clockTimeSchema.safeParse(clock).success) return null;
  return Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
}

/** A time of day as a clock, past midnight wrapped onto the next day. */
function clockOf(minutes: number): string {
  const within = ((Math.round(minutes) % MINUTES_A_DAY) + MINUTES_A_DAY) % MINUTES_A_DAY;
  return `${String(Math.floor(within / 60)).padStart(2, '0')}:${String(within % 60).padStart(2, '0')}`;
}

/** The kind of weather a day was answered with, or null for no weather. */
function weatherKindOf(weather: WeatherResult | null): HikeSchedule['weather'] {
  if (!weather || weather.error) return null;
  return weather.type === 'forecast' || weather.type === 'climate' ? weather.type : null;
}

function hourOf(entry: NonNullable<WeatherResult['hourly']>[number], likelihood: boolean): HikeScheduleHour {
  return {
    hour: entry.hour,
    main: entry.main,
    temp_c: Math.round(entry.temp),
    rain_pct: likelihood ? Math.max(0, Math.min(100, Math.round(entry.precipitation_probability))) : null,
    wind_kmh: Number.isFinite(entry.wind) ? Math.max(0, Math.round(entry.wind)) : null,
  };
}

/** The hours from `first` to `last` the weather has, every `step`, at most `most`. */
function hoursBetween(hourly: readonly HikeScheduleHour[], first: number, last: number, step: number, most: number) {
  return hourly
    .filter((entry) => entry.hour >= first && entry.hour <= last && (entry.hour - first) % step === 0)
    .slice(0, most);
}

/** The first hour walked whose weather matches, as the clock it starts at (never before the start). */
function firstWalked(
  hourly: readonly HikeScheduleHour[],
  start: number,
  arrive: number,
  matches: (hour: HikeScheduleHour) => boolean,
) {
  const first = Math.floor(start / 60);
  const last = Math.max(first, Math.ceil(arrive / 60) - 1);
  const hit = hourly.find((entry) => entry.hour >= first && entry.hour <= last && matches(entry));
  return hit ? clockOf(Math.max(hit.hour * 60, start)) : null;
}

/** The warnings of a hike with a start, in the order they matter most: the dark first. */
function warningsOf(
  start: number,
  arrive: number,
  sun: { rise: number | null; set: number | null },
  hourly: readonly HikeScheduleHour[],
  kind: HikeSchedule['weather'],
): HikeWarning[] {
  const warnings: HikeWarning[] = [];
  if (sun.rise !== null && start < sun.rise) warnings.push({ kind: 'dark_start', at: clockOf(sun.rise) });
  if (sun.set !== null && arrive > sun.set) warnings.push({ kind: 'dark_end', at: clockOf(sun.set) });
  else if (sun.set !== null && sun.set - arrive <= HIKE_DUSK_MINUTES)
    warnings.push({ kind: 'dusk', at: clockOf(sun.set) });
  if (kind !== 'forecast') return warnings;
  const thunder = firstWalked(hourly, start, arrive, (hour) => hour.main === 'Thunderstorm');
  if (thunder) warnings.push({ kind: 'thunder', at: thunder });
  const rain = firstWalked(hourly, start, arrive, (hour) => (hour.rain_pct ?? 0) >= HIKE_RAIN_PCT);
  if (rain) warnings.push({ kind: 'rain', at: rain });
  return warnings;
}

/** A hike's day by the rules above: its schedule, and what to look out for. */
export function hikeScheduleOf(input: HikeScheduleInput): { schedule: HikeSchedule; warnings: HikeWarning[] } {
  const kind = weatherKindOf(input.weather);
  const known = kind === null ? null : input.weather;
  // A forecast says how likely rain is, with the day's highest likelihood beside its hours. Last year's
  // weather does not, nor a past day as observed, which is answered as a forecast without it.
  const likelihood = known?.type === 'forecast' && known.precipitation_probability_max !== undefined;
  const hourly = (known?.hourly ?? []).map((entry) => hourOf(entry, likelihood));
  const sun = { rise: minutesOf(known?.sunrise), set: minutesOf(known?.sunset) };
  const start = minutesOf(input.start);
  const minutes = Math.max(0, Math.round(input.minutes));
  const base = {
    date: input.date,
    day_id: input.dayId,
    sunrise: sun.rise === null ? null : clockOf(sun.rise),
    sunset: sun.set === null ? null : clockOf(sun.set),
    weather: kind,
  };
  if (start === null) {
    const latest = sun.set === null ? null : sun.set - HIKE_SUNSET_MARGIN_MINUTES - minutes;
    const daylight =
      sun.rise === null || sun.set === null
        ? []
        : hoursBetween(hourly, Math.ceil(sun.rise / 60), Math.ceil(sun.set / 60) - 1, 2, HIKE_DAYLIGHT_HOURS);
    return {
      schedule: {
        ...base,
        start: null,
        arrive: null,
        next_day: false,
        latest_start: latest !== null && sun.rise !== null && latest >= sun.rise ? clockOf(latest) : null,
        hours: daylight,
      },
      warnings: [],
    };
  }
  const arrive = start + minutes;
  const first = Math.floor(start / 60) - 1;
  const last = Math.floor(arrive / 60) + 1;
  return {
    schedule: {
      ...base,
      start: clockOf(start),
      arrive: clockOf(arrive),
      next_day: arrive >= MINUTES_A_DAY,
      latest_start: null,
      hours: hoursBetween(hourly, first, last, 1, HIKE_SCHEDULE_HOURS),
    },
    warnings: warningsOf(start, arrive, sun, hourly, kind),
  };
}

/** The clock of each point reached `minutes` after a start, null for every point without one. */
export function arrivalsOf(start: string | null, minutes: ReadonlyArray<number | null>): Array<string | null> {
  const from = minutesOf(start);
  return minutes.map((walked) => (from === null || walked === null ? null : clockOf(from + walked)));
}
