// FE-PADDLE-LAKE-ADVICE-001 to FE-PADDLE-LAKE-ADVICE-002: when the wind makes the shore worth suggesting (PAD-11 with PAD-08).
import type { WindForecastResponse, WindHour } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { crossesLake, windForShore } from './lakeStyleAdvice';

function forecast(hours: Array<Partial<WindHour> & { hour: number }>): WindForecastResponse {
  return {
    status: 'forecast',
    date: '2026-06-01',
    lat: 53.4,
    lng: 12.7,
    timezone: 'Europe/Berlin',
    source: 'Open-Meteo',
    fetched_at: '2026-05-30T08:00:00Z',
    horizon_days: 16,
    day: null,
    hours: hours.map((hour) => ({ speed_kmh: null, gusts_kmh: null, direction_deg: null, ...hour })),
  } as WindForecastResponse;
}

describe('lakeStyleAdvice', () => {
  it('FE-PADDLE-LAKE-ADVICE-001: a fresh breeze or strong gusts in the paddling hours suggest the shore; a stormy night does not', () => {
    expect(windForShore(forecast([{ hour: 10, speed_kmh: 12, gusts_kmh: 22 }]))).toBeNull();
    expect(windForShore(forecast([{ hour: 14, speed_kmh: 21.4, gusts_kmh: 26 }]))).toEqual({
      meanKmh: 21,
      gustsKmh: 26,
    });
    expect(windForShore(forecast([{ hour: 14, speed_kmh: 15, gusts_kmh: 31 }]))).toEqual({ meanKmh: 15, gustsKmh: 31 });
    expect(windForShore(forecast([{ hour: 3, speed_kmh: 40, gusts_kmh: 70 }]))).toBeNull();
    // An hour without a value is no calm hour, but it is no wind either.
    expect(windForShore(forecast([{ hour: 12 }]))).toBeNull();
  });

  it('FE-PADDLE-LAKE-ADVICE-002: only a route that crosses a lake makes the lake style matter', () => {
    const lake = { kind: 'lake' as const, from: 0, to: 1, name: null, source: null, osm_ref: null, grade: null };
    const leg = (kind: 'lake' | 'water') => ({
      status: 'ok' as const,
      geometry: [
        [53.4, 12.7],
        [53.5, 12.7],
      ] as [number, number][],
      segments: [{ ...lake, kind }],
      distance_m: 1000,
      snapped_m: { from: 0, to: 0 },
    });
    expect(crossesLake(null)).toBe(false);
    expect(crossesLake({ legs: [leg('water'), null] })).toBe(false);
    expect(crossesLake({ legs: [leg('water'), leg('lake')] })).toBe(true);
    expect(crossesLake({ legs: [{ status: 'failed', code: 'offline', at: null }] })).toBe(false);
  });
});
