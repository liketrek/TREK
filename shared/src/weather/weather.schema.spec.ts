import { weatherQuerySchema, detailedWeatherQuerySchema, weatherResultSchema } from './weather.schema';

import { describe, it, expect } from 'vitest';

describe('weatherQuerySchema', () => {
  it('accepts lat/lng and defaults lang to "de"', () => {
    const parsed = weatherQuerySchema.parse({ lat: '52.5', lng: '13.4' });
    expect(parsed).toEqual({ lat: '52.5', lng: '13.4', lang: 'de' });
  });

  it('keeps an explicit lang and optional date', () => {
    const parsed = weatherQuerySchema.parse({
      lat: '1',
      lng: '2',
      date: '2026-07-01',
      lang: 'en',
    });
    expect(parsed.lang).toBe('en');
    expect(parsed.date).toBe('2026-07-01');
  });

  it('rejects missing lat/lng', () => {
    expect(weatherQuerySchema.safeParse({ lng: '13.4' }).success).toBe(false);
    expect(weatherQuerySchema.safeParse({ lat: '', lng: '13.4' }).success).toBe(false);
  });
});

describe('detailedWeatherQuerySchema', () => {
  it('requires a date', () => {
    expect(detailedWeatherQuerySchema.safeParse({ lat: '1', lng: '2' }).success).toBe(false);
    expect(
      detailedWeatherQuerySchema.safeParse({
        lat: '1',
        lng: '2',
        date: '2026-07-01',
      }).success,
    ).toBe(true);
  });
});

describe('weatherResultSchema', () => {
  it('accepts a minimal current-weather result', () => {
    const r = weatherResultSchema.parse({
      temp: 21,
      main: 'Clear',
      description: 'Klar',
      type: 'current',
    });
    expect(r.temp).toBe(21);
  });

  it('accepts a detailed result with hourly entries and a no_forecast error', () => {
    expect(
      weatherResultSchema.safeParse({
        temp: 0,
        main: '',
        description: '',
        type: '',
        error: 'no_forecast',
      }).success,
    ).toBe(true);
    expect(
      weatherResultSchema.safeParse({
        temp: 18,
        main: 'Rain',
        description: 'Regen',
        type: 'forecast',
        sunrise: '05:30',
        sunset: '21:10',
        precipitation_sum: 2.4,
        hourly: [
          {
            hour: 9,
            temp: 17,
            precipitation: 0.1,
            precipitation_probability: 20,
            main: 'Clouds',
            wind: 12,
            humidity: 80,
          },
        ],
      }).success,
    ).toBe(true);
  });
});
