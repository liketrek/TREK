/**
 * FE-AI-TOUR-013 to FE-AI-TOUR-016
 *
 * A tour's day on its card: the daylight and the walk on one bar, the walk
 * in the dark marked apart, an arrival past midnight on the next day, the
 * forecast's hours only for a forecast, and the time on the way at a spot.
 */
import type { TourRouteSchedule } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { HIKE, SAVED } from '../../../../../tests/helpers/assistantTour';
import { clockAfter, clockMinutes, dayBarOf, forecastHours, timeAt } from './tourRouteDayModel';

const DAY = HIKE.schedule as TourRouteSchedule;

describe('tourRouteDayModel', () => {
  it('FE-AI-TOUR-013: lays the daylight and the walk on the hours from one before sunrise to one after sunset', () => {
    expect(dayBarOf(DAY)).toEqual({
      daylight: { start: 7.69, size: 84.62 },
      walk: { start: 15.38, size: 25.64 },
      dark: [],
    });
  });

  it('FE-AI-TOUR-014: marks the walk before sunrise and after sunset, and puts an arrival past midnight on the next day', () => {
    const long = { ...DAY, start: '06:00', arrive: '19:00' };
    expect(dayBarOf(long)?.dark).toEqual([
      { start: 6.67, size: 6.67 },
      { start: 86.67, size: 6.67 },
    ]);
    const night = { ...DAY, start: '22:00', arrive: '01:30', nextDay: true, sunrise: null, sunset: null };
    expect(dayBarOf(night)).toEqual({ daylight: null, walk: { start: 16.67, size: 58.33 }, dark: [] });
    expect(dayBarOf({ ...night, start: null, arrive: null })).toBeNull();
  });

  it('FE-AI-TOUR-015: shows the hours of a forecast only, never last year’s climate hours', () => {
    expect(forecastHours(DAY)).toHaveLength(4);
    expect(forecastHours({ ...DAY, weather: 'climate' })).toEqual([]);
    expect(forecastHours({ ...DAY, weather: null })).toEqual([]);
  });

  it('FE-AI-TOUR-016: the time at a spot is shared out by distance, as a clock when the day has a start', () => {
    expect(clockMinutes('08:05')).toBe(485);
    expect(clockAfter('23:30', 45)).toBe('00:15');
    expect(timeAt(HIKE, 4100)).toEqual({ clock: '09:40', minutes: 100 });
    expect(timeAt(HIKE, 99_999)).toEqual({ clock: '11:20', minutes: 200 });
    expect(timeAt(SAVED, 4100)).toEqual({ clock: null, minutes: 100 });
    expect(timeAt({ ...HIKE, minutes: null }, 4100)).toBeNull();
  });
});
