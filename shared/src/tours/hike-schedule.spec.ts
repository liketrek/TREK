import type { HourlyEntry, WeatherResult } from '../weather/weather.schema';
import {
  arrivalsOf,
  HIKE_DAYLIGHT_HOURS,
  HIKE_SCHEDULE_HOURS,
  hikeScheduleOf,
  hikeScheduleSchema,
  hikeWarningSchema,
  type HikeScheduleInput,
} from './hike-schedule';

import { describe, expect, it } from 'vitest';

/** A day's hours, clear, 10 % rain, 12 km/h of wind, with the hours `over` names changed. */
function hoursOf(over: Record<number, Partial<HourlyEntry>> = {}): HourlyEntry[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    temp: 8 + hour / 2,
    precipitation: 0,
    precipitation_probability: 10,
    main: 'Clear',
    wind: 12.4,
    humidity: 60,
    ...over[hour],
  }));
}

/** A day's weather; a forecast says the day's highest likelihood of rain beside its hours, as Open-Meteo's does. */
function day(type: 'forecast' | 'climate', over: Record<number, Partial<HourlyEntry>> = {}): WeatherResult {
  return {
    type,
    temp: 14,
    main: 'Clear',
    description: '',
    sunrise: '06:30',
    sunset: '19:00',
    ...(type === 'forecast' ? { precipitation_probability_max: 10 } : {}),
    hourly: hoursOf(over),
  };
}

const input = (over: Partial<HikeScheduleInput> = {}): HikeScheduleInput => ({
  date: '2027-07-10',
  dayId: 4,
  start: '08:00',
  minutes: 200,
  weather: day('forecast'),
  ...over,
});

const kinds = (over: Partial<HikeScheduleInput>) => hikeScheduleOf(input(over)).warnings.map(({ kind }) => kind);

describe('the day of a hike with a start', () => {
  it('HIKE-SCHED-001: arrives the walking time after the start, and shows the hours from one before to one after', () => {
    const { schedule, warnings } = hikeScheduleOf(input());
    expect(hikeScheduleSchema.parse(schedule)).toEqual(schedule);
    expect(schedule).toMatchObject({
      date: '2027-07-10',
      day_id: 4,
      start: '08:00',
      arrive: '11:20',
      next_day: false,
      sunrise: '06:30',
      sunset: '19:00',
      latest_start: null,
      weather: 'forecast',
    });
    expect(schedule.hours.map(({ hour }) => hour)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(schedule.hours[1]).toEqual({ hour: 8, main: 'Clear', temp_c: 12, rain_pct: 10, wind_kmh: 12 });
    expect(warnings).toEqual([]);
  });

  it('HIKE-SCHED-002: warns of a start before sunrise and of an arrival after sunset, at the sun times', () => {
    expect(hikeScheduleOf(input({ start: '05:45' })).warnings).toEqual([{ kind: 'dark_start', at: '06:30' }]);
    const late = hikeScheduleOf(input({ start: '16:00' }));
    expect(late.schedule.arrive).toBe('19:20');
    expect(late.warnings).toEqual([{ kind: 'dark_end', at: '19:00' }]);
    expect(kinds({ start: '04:00', minutes: 16 * 60 })).toEqual(['dark_start', 'dark_end']);
  });

  it('HIKE-SCHED-003: warns of dusk for an arrival within the hour before sunset, 59 minutes yes and 61 no', () => {
    // A walk of 3 h 20 min against a sunset at 19:00.
    expect(kinds({ start: '14:41' })).toEqual(['dusk']);
    expect(kinds({ start: '14:39' })).toEqual([]);
    expect(kinds({ start: '14:40' })).toEqual(['dusk']);
    expect(kinds({ start: '15:40' })).toEqual(['dusk']);
    expect(hikeScheduleOf(input({ start: '14:41' })).warnings).toEqual([{ kind: 'dusk', at: '19:00' }]);
  });

  it('HIKE-SCHED-004: warns of thunder and rain only in an hour walked, and only on a forecast', () => {
    const stormy = { 10: { main: 'Thunderstorm' }, 13: { main: 'Thunderstorm' }, 9: { precipitation_probability: 60 } };
    const { warnings } = hikeScheduleOf(input({ weather: day('forecast', stormy) }));
    expect(warnings).toEqual([
      { kind: 'thunder', at: '10:00' },
      { kind: 'rain', at: '09:00' },
    ]);
    for (const warning of warnings) expect(hikeWarningSchema.parse(warning)).toEqual(warning);
    // A storm after the arrival (11:20) or before the start is no warning; rain at 59 % neither.
    const outside = { 12: { main: 'Thunderstorm' }, 7: { main: 'Thunderstorm' }, 9: { precipitation_probability: 59 } };
    expect(kinds({ weather: day('forecast', outside) })).toEqual([]);
    // The hour the hike starts in warns from the start, not from the full hour.
    expect(
      hikeScheduleOf(input({ start: '08:30', weather: day('forecast', { 8: { main: 'Thunderstorm' } }) })).warnings,
    ).toEqual([{ kind: 'thunder', at: '08:30' }]);
    // An arrival on the full hour walks nothing of the hour that follows.
    expect(kinds({ minutes: 180, weather: day('forecast', { 11: { main: 'Thunderstorm' } }) })).toEqual([]);
    const climate = hikeScheduleOf(input({ weather: day('climate', stormy) }));
    expect(climate.warnings).toEqual([]);
    expect(climate.schedule.weather).toBe('climate');
    expect(climate.schedule.hours.every((hour) => hour.rain_pct === null)).toBe(true);
  });

  it('HIKE-SCHED-012: shows no likelihood of rain for a past day as observed, and warns of its storms only', () => {
    // A past day is answered as a forecast without the day's highest likelihood, its hours at 0 %.
    const { precipitation_probability_max: _max, ...observed } = day('forecast', {
      9: { main: 'Thunderstorm', precipitation_probability: 0 },
      10: { precipitation_probability: 90 },
    });
    const past = hikeScheduleOf(input({ weather: observed }));
    expect(past.schedule.weather).toBe('forecast');
    expect(past.schedule.hours.every((hour) => hour.rain_pct === null)).toBe(true);
    expect(past.warnings).toEqual([{ kind: 'thunder', at: '09:00' }]);
  });

  it('HIKE-SCHED-005: puts an arrival past midnight on the next day, after sunset', () => {
    const { schedule, warnings } = hikeScheduleOf(input({ start: '20:30', minutes: 240 }));
    expect(schedule).toMatchObject({ arrive: '00:30', next_day: true });
    expect(schedule.hours.map(({ hour }) => hour)).toEqual([19, 20, 21, 22, 23]);
    expect(warnings.map(({ kind }) => kind)).toEqual(['dark_end']);
  });

  it('HIKE-SCHED-006: shows at most the first hours of a very long hike', () => {
    const { schedule } = hikeScheduleOf(input({ start: '00:10', minutes: 23 * 60 }));
    expect(schedule.hours).toHaveLength(HIKE_SCHEDULE_HOURS);
    expect(schedule.hours[0]?.hour).toBe(0);
  });
});

describe('the day of a hike without a start', () => {
  it('HIKE-SCHED-007: says the latest start that ends half an hour before sunset, with every second hour of daylight', () => {
    const { schedule, warnings } = hikeScheduleOf(input({ start: null }));
    expect(schedule).toMatchObject({ start: null, arrive: null, next_day: false, latest_start: '15:10' });
    expect(schedule.hours.map(({ hour }) => hour)).toEqual([7, 9, 11, 13, 15, 17]);
    expect(warnings).toEqual([]);
    const long = hikeScheduleOf(
      input({ start: null, weather: { ...day('forecast'), sunrise: '04:00', sunset: '22:00' } }),
    );
    expect(long.schedule.hours).toHaveLength(HIKE_DAYLIGHT_HOURS);
  });

  it('HIKE-SCHED-008: has no latest start where the hike does not fit into the daylight', () => {
    expect(hikeScheduleOf(input({ start: null, minutes: 720 })).schedule.latest_start).toBe('06:30');
    expect(hikeScheduleOf(input({ start: null, minutes: 721 })).schedule.latest_start).toBeNull();
  });
});

describe('a hike whose weather could not be had', () => {
  it('HIKE-SCHED-009: keeps the start and arrival, without sun, hours or warnings', () => {
    for (const weather of [null, { temp: 0, main: '', description: '', type: '', error: 'no_forecast' }]) {
      const { schedule, warnings } = hikeScheduleOf(input({ start: '05:00', weather }));
      expect(schedule).toEqual({
        date: '2027-07-10',
        day_id: 4,
        start: '05:00',
        arrive: '08:20',
        next_day: false,
        sunrise: null,
        sunset: null,
        latest_start: null,
        weather: null,
        hours: [],
      });
      expect(warnings).toEqual([]);
    }
    const unknown = hikeScheduleOf(input({ start: null, weather: { ...day('forecast'), type: 'current' } }));
    expect(unknown.schedule).toMatchObject({ weather: null, latest_start: null, hours: [] });
  });

  it('HIKE-SCHED-010: reads no sun from a time it cannot read, and no hours without the sun', () => {
    const { schedule } = hikeScheduleOf(
      input({ start: null, weather: { ...day('forecast'), sunrise: '', sunset: null } }),
    );
    expect(schedule).toMatchObject({ sunrise: null, sunset: null, latest_start: null, hours: [] });
  });
});

describe('when each point is reached', () => {
  it('HIKE-SCHED-011: adds the walking minutes to the start, past midnight onto the next day, none without a start', () => {
    expect(arrivalsOf('08:00', [0, 95, null, 1000])).toEqual(['08:00', '09:35', null, '00:40']);
    expect(arrivalsOf(null, [0, 95])).toEqual([null, null]);
  });
});
