import { COMPASS_POINTS, compassPointOf, windForecastResponseSchema, windQuerySchema } from './wind.schema';

import { describe, expect, it } from 'vitest';

describe('windQuerySchema (PAD-08)', () => {
  it('reads the place from the query string and wants a day', () => {
    expect(windQuerySchema.parse({ lat: '47.55', lng: '9.68', date: '2026-10-18' })).toEqual({
      lat: 47.55,
      lng: 9.68,
      date: '2026-10-18',
    });
    expect(windQuerySchema.safeParse({ lat: '47.55', lng: '9.68' }).success).toBe(false);
    expect(windQuerySchema.safeParse({ lat: '91', lng: '9.68', date: '2026-10-18' }).success).toBe(false);
    expect(windQuerySchema.safeParse({ lat: '47.55', lng: '9.68', date: '18.10.2026' }).success).toBe(false);
  });
});

describe('windForecastResponseSchema', () => {
  it('a day without a forecast carries its status and no figures; a missing value stays null, never zero', () => {
    const past = {
      status: 'past',
      date: '2026-10-01',
      lat: 47.55,
      lng: 9.68,
      timezone: null,
      source: 'Open-Meteo',
      fetched_at: '2026-10-16T10:00:00.000Z',
      horizon_days: 16,
      hours: [],
      day: null,
    };
    expect(windForecastResponseSchema.safeParse(past).success).toBe(true);
    const hour = { hour: 9, speed_kmh: 12, gusts_kmh: null, direction_deg: null };
    expect(windForecastResponseSchema.safeParse({ ...past, status: 'forecast', hours: [hour] }).success).toBe(true);
    expect(windForecastResponseSchema.safeParse({ ...past, source: 'Climate' }).success).toBe(false);
  });
});

describe('compassPointOf', () => {
  it('names the sixteen points, wrapping around north', () => {
    expect(compassPointOf(0)).toBe('N');
    expect(compassPointOf(11)).toBe('N');
    expect(compassPointOf(12)).toBe('NNE');
    expect(compassPointOf(90)).toBe('E');
    expect(compassPointOf(225)).toBe('SW');
    expect(compassPointOf(349)).toBe('N');
    expect(compassPointOf(-90)).toBe('W');
    expect(compassPointOf(720 + 180)).toBe('S');
    expect(COMPASS_POINTS).toHaveLength(16);
  });
});
