import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Fake timers for the cache-expiry cases below. The module no longer starts a
// timer of its own on import — that moved to WeatherService's lifecycle.
vi.useFakeTimers();

// Prevent real HTTP requests
vi.stubGlobal('fetch', vi.fn());

afterAll(() => vi.unstubAllGlobals());

import {
  estimateCondition,
  cacheKey,
  getWeather,
  getDetailedWeather,
  ApiError,
  type WeatherResult,
} from '../../../../src/nest/weather/weather.impl';

// ── estimateCondition ────────────────────────────────────────────────────────

describe('estimateCondition', () => {
  describe('heavy precipitation (precipMm > 5)', () => {
    it('returns Snow when temp <= 0', () => {
      expect(estimateCondition(0, 6)).toBe('Snow');
      expect(estimateCondition(-5, 10)).toBe('Snow');
    });

    it('returns Rain when temp > 0', () => {
      expect(estimateCondition(1, 6)).toBe('Rain');
      expect(estimateCondition(20, 50)).toBe('Rain');
    });

    it('boundary: precipMm = 5.01 and temp = 0 -> Snow', () => {
      expect(estimateCondition(0, 5.01)).toBe('Snow');
    });

    it('boundary: precipMm = 5 is NOT heavy (exactly 5, not > 5) -> falls through', () => {
      // precipMm = 5 fails the > 5 check, falls to > 1 check -> Snow or Drizzle
      expect(estimateCondition(0, 5)).toBe('Snow'); // > 1 and temp <= 0
      expect(estimateCondition(5, 5)).toBe('Drizzle'); // > 1 and temp > 0
    });
  });

  describe('moderate precipitation (precipMm > 1)', () => {
    it('returns Snow when temp <= 0', () => {
      expect(estimateCondition(0, 2)).toBe('Snow');
      expect(estimateCondition(-10, 1.5)).toBe('Snow');
    });

    it('returns Drizzle when temp > 0', () => {
      expect(estimateCondition(5, 2)).toBe('Drizzle');
      expect(estimateCondition(15, 3)).toBe('Drizzle');
    });
  });

  describe('light precipitation (precipMm > 0.3)', () => {
    it('returns Clouds regardless of temperature', () => {
      expect(estimateCondition(-5, 0.5)).toBe('Clouds');
      expect(estimateCondition(25, 0.5)).toBe('Clouds');
    });

    it('boundary: precipMm = 0.31 -> Clouds', () => {
      expect(estimateCondition(20, 0.31)).toBe('Clouds');
    });

    it('boundary: precipMm = 0.3 is NOT light precipitation -> falls through', () => {
      // precipMm = 0.3 fails the > 0.3 check, falls to temperature check
      expect(estimateCondition(20, 0.3)).toBe('Clear'); // temp > 15
      expect(estimateCondition(10, 0.3)).toBe('Clouds'); // temp <= 15
    });
  });

  describe('dry conditions (precipMm <= 0.3)', () => {
    it('returns Clear when temp > 15', () => {
      expect(estimateCondition(16, 0)).toBe('Clear');
      expect(estimateCondition(30, 0.1)).toBe('Clear');
    });

    it('returns Clouds when temp <= 15', () => {
      expect(estimateCondition(15, 0)).toBe('Clouds');
      expect(estimateCondition(10, 0)).toBe('Clouds');
      expect(estimateCondition(-5, 0)).toBe('Clouds');
    });

    it('boundary: temp = 15 -> Clouds (not > 15)', () => {
      expect(estimateCondition(15, 0)).toBe('Clouds');
    });
  });
});

// ── cacheKey ─────────────────────────────────────────────────────────────────

describe('cacheKey', () => {
  it('rounds lat and lng to 2 decimal places', () => {
    expect(cacheKey('48.8566', '2.3522', '2024-06-15')).toBe('48.86_2.35_2024-06-15');
  });

  it('uses "current" when date is undefined', () => {
    expect(cacheKey('10.0', '20.0')).toBe('10.00_20.00_current');
  });

  it('handles negative coordinates', () => {
    expect(cacheKey('-33.8688', '151.2093', '2024-01-01')).toBe('-33.87_151.21_2024-01-01');
  });

  it('pads to 2 decimal places for round numbers', () => {
    expect(cacheKey('48', '2', '2024-01-01')).toBe('48.00_2.00_2024-01-01');
  });

  it('preserves the date string as-is', () => {
    expect(cacheKey('0', '0', 'climate')).toBe('0.00_0.00_climate');
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal mock Response for fetch. */
function mockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

/** ISO date string offset by `days` from now (fake-timer "now"). */
function dateOffset(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// ── getWeather ────────────────────────────────────────────────────────────────

describe('getWeather', () => {
  // Use coordinates that are unique per describe block to avoid cross-test cache
  // pollution. Each nested describe uses a distinct lat so the module-level Map
  // never returns stale data from a sibling test.

  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('with date — cache hit', () => {
    it('returns cached result without calling fetch', async () => {
      const date = dateOffset(2);
      const forecastBody = {
        daily: {
          time: [date],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          weathercode: [0],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(forecastBody));

      // First call populates the cache
      const first = await getWeather('10.00', '20.00', date, 'en');
      expect(fetch).toHaveBeenCalledTimes(1);

      vi.mocked(fetch).mockReset();

      // Second call with identical arguments should be served from cache
      const second = await getWeather('10.00', '20.00', date, 'en');
      expect(fetch).not.toHaveBeenCalled();
      expect(second).toEqual(first);
    });
  });

  describe('with date — forecast path (diffDays -1 .. +16)', () => {
    it('returns a forecast WeatherResult for a date 3 days away', async () => {
      const date = dateOffset(3);
      const body = {
        daily: {
          time: [date],
          temperature_2m_max: [25],
          temperature_2m_min: [15],
          weathercode: [1],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('11.00', '21.00', date, 'en');

      expect(result.type).toBe('forecast');
      expect(result.temp).toBe(20); // (25+15)/2
      expect(result.temp_max).toBe(25);
      expect(result.temp_min).toBe(15);
      expect(result.main).toBe('Clear'); // WMO code 1
      expect(result.description).toBe('Mainly clear');
    });

    it('uses German descriptions when lang is "de"', async () => {
      const date = dateOffset(4);
      const body = {
        daily: {
          time: [date],
          temperature_2m_max: [10],
          temperature_2m_min: [5],
          weathercode: [3],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('11.01', '21.01', date, 'de');

      expect(result.description).toBe('Bewolkt'); // German for code 3
    });

    it('falls back to "Clouds" for an unknown WMO code', async () => {
      const date = dateOffset(5);
      const body = {
        daily: {
          time: [date],
          temperature_2m_max: [10],
          temperature_2m_min: [5],
          weathercode: [999], // not in WMO_MAP
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('11.02', '21.02', date, 'en');

      expect(result.main).toBe('Clouds');
    });

    it('throws ApiError when response.ok is false', async () => {
      const date = dateOffset(2);
      const body = { reason: 'rate limited' };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body, false, 429));
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body, false, 429));

      await expect(getWeather('12.00', '22.00', date, 'en')).rejects.toThrow(ApiError);
      await expect(getWeather('12.00', '22.00', date, 'en')).rejects.toMatchObject({
        status: 429,
        message: 'rate limited',
      });
    });

    it('throws ApiError when data.error is true', async () => {
      const date = dateOffset(2);
      const body = { error: true, reason: 'invalid coordinates' };
      // Need a fresh coordinate to avoid the cache from the previous test failure
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body, true, 200));

      await expect(getWeather('12.01', '22.01', date, 'en')).rejects.toThrow(ApiError);
    });

    it('falls through to climate path when date is not found in forecast data', async () => {
      // The forecast API returns data but NOT for our target date; the code
      // checks idx === -1 and falls into the diffDays > -1 climate branch.
      const date = dateOffset(3);
      const forecastBody = {
        daily: {
          time: ['1970-01-01'], // deliberately wrong date
          temperature_2m_max: [10],
          temperature_2m_min: [5],
          weathercode: [0],
        },
      };

      // Archive response for the climate fallback
      const refDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const archiveBody = {
        daily: {
          time: ['some-date'],
          temperature_2m_max: [18],
          temperature_2m_min: [8],
          precipitation_sum: [0],
        },
      };

      vi.mocked(fetch)
          .mockResolvedValueOnce(mockResponse(forecastBody))
          .mockResolvedValueOnce(mockResponse(archiveBody));

      const result = await getWeather('13.00', '23.00', date, 'en');

      expect(result.type).toBe('climate');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('with date — past date (diffDays < -1)', () => {
    it('returns forecast-type WeatherResult from the archive API', async () => {
      const date = dateOffset(-5); // 5 days in the past
      const archiveBody = {
        daily: {
          time: [date],
          temperature_2m_max: [18],
          temperature_2m_min: [10],
          weathercode: [2],
          precipitation_sum: [0],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(archiveBody));

      const result = await getWeather('14.00', '24.00', date, 'en');

      expect(result.type).toBe('forecast');
      expect(result.temp).toBe(14);
      expect(result.temp_max).toBe(18);
      expect(result.temp_min).toBe(10);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(vi.mocked(fetch).mock.calls[0][0]).toContain('archive-api.open-meteo.com');
    });

    // #1614 — an entry made at 14:30 wants the weather of that hour. Averaging a
    // rainy morning with a bright afternoon is what the daily figures do.
    it('answers for the given hour when a time comes with the date', async () => {
      const date = dateOffset(-5);
      const hourly = { temperature_2m: Array(24).fill(null), weathercode: Array(24).fill(null) };
      hourly.temperature_2m[14] = 21;
      hourly.weathercode[14] = 0;
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({
        daily: { time: [date], temperature_2m_max: [18], temperature_2m_min: [10], weathercode: [2], precipitation_sum: [0] },
        hourly,
      }));

      const result = await getWeather('14.02', '24.02', date, 'en', '14:30');

      expect(vi.mocked(fetch).mock.calls[0][0]).toContain('hourly=temperature_2m,weathercode');
      expect(result.temp).toBe(21);
      // The daily average would have been 14, so this is demonstrably the hour.
      expect(result.temp_max).toBeUndefined();
    });

    it('falls back to the daily figures when the hour has no reading', async () => {
      const date = dateOffset(-5);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({
        daily: { time: [date], temperature_2m_max: [18], temperature_2m_min: [10], weathercode: [2], precipitation_sum: [0] },
        hourly: { temperature_2m: Array(24).fill(null), weathercode: Array(24).fill(null) },
      }));

      const result = await getWeather('14.03', '24.03', date, 'en', '14:30');

      expect(result.temp).toBe(14);
      expect(result.temp_max).toBe(18);
    });

    it('ignores an unparseable time rather than guessing midnight', async () => {
      const date = dateOffset(-5);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({
        daily: { time: [date], temperature_2m_max: [18], temperature_2m_min: [10], weathercode: [2], precipitation_sum: [0] },
      }));

      const result = await getWeather('14.04', '24.04', date, 'en', 'not-a-time');

      expect(vi.mocked(fetch).mock.calls[0][0]).not.toContain('hourly=');
      expect(result.temp).toBe(14);
    });

    it('returns no_forecast error when archive has no data for the date', async () => {
      const date = dateOffset(-5);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], weathercode: [] } }));

      const result = await getWeather('14.01', '24.01', date, 'en');

      expect(result.error).toBe('no_forecast');
    });
  });

  describe('with date — climate / archive path (diffDays > 16)', () => {
    it('returns a climate WeatherResult for a far-future date', async () => {
      const date = dateOffset(20);
      const body = {
        daily: {
          time: ['2025-01-01', '2025-01-02'],
          temperature_2m_max: [22, 24],
          temperature_2m_min: [12, 14],
          precipitation_sum: [0, 0.1],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('15.00', '25.00', date, 'en');

      expect(result.type).toBe('climate');
      expect(result.temp).toBe(18); // avg of (22+12)/2=17 and (24+14)/2=19 -> avg 18
      expect(result.temp_max).toBe(23);
      expect(result.temp_min).toBe(13);
    });

    it('throws ApiError when archive API response.ok is false', async () => {
      const date = dateOffset(20);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'server error' }, false, 500));
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'server error' }, false, 500));

      await expect(getWeather('15.01', '25.01', date, 'en')).rejects.toThrow(ApiError);
      await expect(getWeather('15.01', '25.01', date, 'en')).rejects.toMatchObject({ status: 500 });
    });

    it('returns no_forecast when archive daily data is missing', async () => {
      const date = dateOffset(20);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({}));

      const result = await getWeather('15.02', '25.02', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('returns no_forecast when archive daily.time is empty', async () => {
      const date = dateOffset(20);
      const body = { daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [] } };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('15.03', '25.03', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('returns no_forecast when all temperature entries are null', async () => {
      const date = dateOffset(20);
      const body = {
        daily: {
          time: ['2025-01-01'],
          temperature_2m_max: [null],
          temperature_2m_min: [null],
          precipitation_sum: [0],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('15.04', '25.04', date, 'en');

      expect(result.error).toBe('no_forecast');
    });
  });

  describe('without date — current weather path', () => {
    it('returns current WeatherResult', async () => {
      const body = {
        current: { temperature_2m: 18.7, weathercode: 2 },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('16.00', '26.00', undefined, 'en');

      expect(result.type).toBe('current');
      expect(result.temp).toBe(19); // Math.round(18.7)
      expect(result.main).toBe('Clouds'); // WMO code 2
      expect(result.description).toBe('Partly cloudy');
    });

    it('uses German descriptions when lang is "de"', async () => {
      const body = { current: { temperature_2m: 10, weathercode: 45 } };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getWeather('16.01', '26.01', undefined, 'de');

      expect(result.description).toBe('Nebel');
    });

    it('returns cached current weather on second identical call', async () => {
      const body = { current: { temperature_2m: 22, weathercode: 0 } };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const first = await getWeather('16.02', '26.02', undefined, 'en');
      vi.mocked(fetch).mockReset();
      const second = await getWeather('16.02', '26.02', undefined, 'en');

      expect(fetch).not.toHaveBeenCalled();
      expect(second).toEqual(first);
    });

    it('throws ApiError when current weather API returns error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'bad request' }, false, 400));
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'bad request' }, false, 400));

      await expect(getWeather('16.03', '26.03', undefined, 'en')).rejects.toThrow(ApiError);
      await expect(getWeather('16.03', '26.03', undefined, 'en')).rejects.toMatchObject({ status: 400 });
    });

    it('throws ApiError when data.error flag is set on current weather response', async () => {
      const body = { error: true, reason: 'quota exceeded' };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body, true, 200));

      await expect(getWeather('16.04', '26.04', undefined, 'en')).rejects.toThrow(ApiError);
    });
  });
});

// ── getDetailedWeather ────────────────────────────────────────────────────────

describe('getDetailedWeather', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('cache hit', () => {
    it('returns cached result without calling fetch a second time', async () => {
      const date = dateOffset(5);
      const dailyBody = {
        daily: {
          time: [date],
          temperature_2m_max: [28],
          temperature_2m_min: [18],
          weathercode: [0],
          precipitation_sum: [0],
          precipitation_probability_max: [0],
          windspeed_10m_max: [10],
          sunrise: [`${date}T06:00`],
          sunset: [`${date}T20:00`],
        },
        hourly: { time: [], temperature_2m: [] },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(dailyBody));

      const first = await getDetailedWeather('30.00', '40.00', date, 'en');
      vi.mocked(fetch).mockReset();
      const second = await getDetailedWeather('30.00', '40.00', date, 'en');

      expect(fetch).not.toHaveBeenCalled();
      expect(second).toEqual(first);
    });
  });

  describe('forecast path (diffDays <= 16)', () => {
    it('returns a detailed forecast WeatherResult with hourly data', async () => {
      const date = dateOffset(6);
      const body = {
        daily: {
          time: [date],
          temperature_2m_max: [30],
          temperature_2m_min: [20],
          weathercode: [80],
          precipitation_sum: [5],
          precipitation_probability_max: [70],
          windspeed_10m_max: [15],
          sunrise: [`${date}T05:45`],
          sunset: [`${date}T21:15`],
        },
        hourly: {
          time: [`${date}T12:00`, `${date}T13:00`],
          temperature_2m: [28, 29],
          precipitation_probability: [60, 65],
          precipitation: [1.2, 0.8],
          weathercode: [80, 81],
          windspeed_10m: [12, 14],
          relativehumidity_2m: [70, 68],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('31.00', '41.00', date, 'en');

      expect(result.type).toBe('forecast');
      expect(result.temp).toBe(25); // (30+20)/2
      expect(result.temp_max).toBe(30);
      expect(result.temp_min).toBe(20);
      expect(result.main).toBe('Rain'); // WMO code 80
      expect(result.precipitation_sum).toBe(5);
      expect(result.precipitation_probability_max).toBe(70);
      expect(result.wind_max).toBe(15);
      expect(result.sunrise).toBe('05:45');
      expect(result.sunset).toBe('21:15');
      expect(result.hourly).toHaveLength(2);
      expect(result.hourly![0].temp).toBe(28);
      expect(result.hourly![0].precipitation_probability).toBe(60);
      expect(result.hourly![1].main).toBe('Rain'); // WMO code 81
    });

    it('returns no_forecast when daily data is missing', async () => {
      const date = dateOffset(7);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({}));

      const result = await getDetailedWeather('31.01', '41.01', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('returns no_forecast when daily.time is empty', async () => {
      const date = dateOffset(7);
      const body = {
        daily: {
          time: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          weathercode: [],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('31.02', '41.02', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('throws ApiError when forecast API returns !ok', async () => {
      const date = dateOffset(8);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'not found' }, false, 404));
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'not found' }, false, 404));

      await expect(getDetailedWeather('31.03', '41.03', date, 'en')).rejects.toThrow(ApiError);
      await expect(getDetailedWeather('31.03', '41.03', date, 'en')).rejects.toMatchObject({ status: 404 });
    });

    it('throws ApiError when data.error flag is set', async () => {
      const date = dateOffset(9);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ error: true, reason: 'bad coords' }));

      await expect(getDetailedWeather('31.04', '41.04', date, 'en')).rejects.toThrow(ApiError);
    });

    it('handles missing hourly block gracefully', async () => {
      const date = dateOffset(10);
      const body = {
        daily: {
          time: [date],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          weathercode: [0],
          precipitation_sum: [0],
          precipitation_probability_max: [0],
          windspeed_10m_max: [5],
          sunrise: [`${date}T06:00`],
          sunset: [`${date}T20:00`],
        },
        // no hourly field
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('31.05', '41.05', date, 'en');

      expect(result.type).toBe('forecast');
      expect(result.hourly).toEqual([]);
    });
  });

  describe('climate / archive path (diffDays > 16)', () => {
    it('returns a detailed climate WeatherResult with hourly data', async () => {
      const date = dateOffset(20);
      const refDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const refYear = refDate.getFullYear() - 1;
      const refDateStr = `${refYear}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;

      const body = {
        daily: {
          time: [refDateStr],
          temperature_2m_max: [26],
          temperature_2m_min: [16],
          weathercode: [63],
          precipitation_sum: [8],
          windspeed_10m_max: [20],
          sunrise: [`${refDateStr}T06:30`],
          sunset: [`${refDateStr}T20:30`],
        },
        hourly: {
          time: [`${refDateStr}T10:00`, `${refDateStr}T11:00`],
          temperature_2m: [22, 24],
          precipitation: [2, 1],
          weathercode: [63, 61],
          windspeed_10m: [18, 16],
          relativehumidity_2m: [80, 75],
        },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('32.00', '42.00', date, 'en');

      expect(result.type).toBe('climate');
      expect(result.temp).toBe(21); // (26+16)/2
      expect(result.temp_max).toBe(26);
      expect(result.temp_min).toBe(16);
      expect(result.main).toBe('Rain'); // WMO code 63
      expect(result.description).toBe('Rain'); // WMO_DESCRIPTION_EN[63]
      expect(result.precipitation_sum).toBe(8);
      expect(result.wind_max).toBe(20);
      expect(result.sunrise).toBe('06:30');
      expect(result.sunset).toBe('20:30');
      expect(result.hourly).toHaveLength(2);
      expect(result.hourly![0].temp).toBe(22);
      expect(result.hourly![0].precipitation).toBe(2);
      expect(result.hourly![1].main).toBe('Rain'); // WMO code 61
    });

    it('uses German descriptions when lang is "de"', async () => {
      const date = dateOffset(20);
      const refDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const refYear = refDate.getFullYear() - 1;
      const refDateStr = `${refYear}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;

      const body = {
        daily: {
          time: [refDateStr],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          weathercode: [0],
          precipitation_sum: [0],
          windspeed_10m_max: [5],
        },
        hourly: { time: [], temperature_2m: [] },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('32.01', '42.01', date, 'de');

      expect(result.description).toBe('Klar'); // German WMO_DESCRIPTION_DE[0]
    });

    it('returns no_forecast when archive daily data is missing', async () => {
      const date = dateOffset(20);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({}));

      const result = await getDetailedWeather('32.02', '42.02', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('returns no_forecast when archive daily.time is empty', async () => {
      const date = dateOffset(20);
      const body = { daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], weathercode: [] } };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('32.03', '42.03', date, 'en');

      expect(result.error).toBe('no_forecast');
    });

    it('throws ApiError when archive API returns !ok', async () => {
      const date = dateOffset(20);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'upstream error' }, false, 503));
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ reason: 'upstream error' }, false, 503));

      await expect(getDetailedWeather('32.04', '42.04', date, 'en')).rejects.toThrow(ApiError);
      await expect(getDetailedWeather('32.04', '42.04', date, 'en')).rejects.toMatchObject({ status: 503 });
    });

    it('throws ApiError when archive data.error flag is set', async () => {
      const date = dateOffset(20);
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse({ error: true, reason: 'quota exceeded' }));

      await expect(getDetailedWeather('32.05', '42.05', date, 'en')).rejects.toThrow(ApiError);
    });

    it('falls back to estimateCondition when archive weathercode is undefined', async () => {
      // When daily.weathercode[0] is undefined, the code falls back to
      // estimateCondition(avgTemp, precipitation_sum)
      const date = dateOffset(20);
      const refDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const refYear = refDate.getFullYear() - 1;
      const refDateStr = `${refYear}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;

      const body = {
        daily: {
          time: [refDateStr],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          // weathercode intentionally omitted — will be undefined
          precipitation_sum: [10], // > 5 mm and temp > 0 -> 'Rain'
          windspeed_10m_max: [5],
        },
        hourly: { time: [], temperature_2m: [] },
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse(body));

      const result = await getDetailedWeather('32.06', '42.06', date, 'en');

      // undefined code -> WMO_MAP[undefined] is undefined -> falls back to estimateCondition
      // avgTemp = (20+10)/2 = 15, precip = 10 > 5 and temp 15 > 0 -> 'Rain'
      expect(result.main).toBe('Rain');
    });
  });
});

// ── error paths ──────────────────────────────────────────────────────────────
//
// Three branches the suite never reached. They came into the coverage gate with
// the file when it moved out of services/, and they are the paths a user hits
// when Open-Meteo is having a bad day.

describe('getWeather error paths', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('WEATHER-ERR-001: a failing archive lookup surfaces as ApiError with the upstream reason', async () => {
    const past = dateOffset(-30);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ error: true, reason: 'Archive temporarily unavailable' }, false, 503),
    );

    await expect(getWeather('41.10', '9.10', past, 'en')).rejects.toMatchObject({
      status: 503,
      message: 'Archive temporarily unavailable',
    });
  });

  it('WEATHER-ERR-002: a failing archive lookup without a reason falls back to the generic message', async () => {
    const past = dateOffset(-31);
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse({}, false, 500));

    await expect(getWeather('41.20', '9.20', past, 'en')).rejects.toBeInstanceOf(ApiError);
  });

  it('WEATHER-ERR-003: a far-future date with no usable climate rows answers no_forecast', async () => {
    const farOut = dateOffset(200);
    // Climate API responds 200 but every row is null, so nothing can be averaged.
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        daily: {
          time: [farOut],
          temperature_2m_max: [null],
          temperature_2m_min: [null],
          precipitation_sum: [null],
        },
      }),
    );

    const result = await getWeather('41.30', '9.30', farOut, 'en');
    expect(result.error).toBe('no_forecast');
    expect(result.temp).toBe(0);
  });

  it('WEATHER-ERR-004: an expired cache entry is dropped and the upstream is asked again', async () => {
    const date = dateOffset(4);
    const body = {
      daily: { time: [date], temperature_2m_max: [20], temperature_2m_min: [10], weathercode: [0] },
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse(body));

    await getWeather('41.40', '9.40', date, 'en');
    expect(fetch).toHaveBeenCalledTimes(1);

    // Forecast entries live an hour; step past it.
    vi.advanceTimersByTime(60 * 60 * 1000 + 1000);

    await getWeather('41.40', '9.40', date, 'en');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

// ── coordinate boundary validation ───────────────────────────────────────────

describe('coordinate validation', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it.each([
    ['not-a-number', '10'],
    ['', '10'],
    ['91', '10'],
    ['10', '181'],
    ['10', '&forecast_days=16&latitude=0'],
  ])('WEATHER-COORD-001: getWeather rejects lat=%s lng=%s with a 400 before any fetch', async (lat, lng) => {
    await expect(getWeather(lat, lng, undefined, 'en')).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('WEATHER-COORD-002: getDetailedWeather rejects an out-of-range latitude', async () => {
    await expect(getDetailedWeather('120', '10', dateOffset(2), 'en')).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('WEATHER-COORD-003: a body over the declared size cap is a 502, not a parsed answer', async () => {
    const date = dateOffset(5);
    const body = {
      daily: { time: [date], temperature_2m_max: [20], temperature_2m_min: [10], weathercode: [0] },
    };
    const oversized = {
      ...mockResponse(body),
      headers: { get: (h: string) => (h === 'content-length' ? String(5 * 1024 * 1024) : null) },
    } as unknown as Response;
    vi.mocked(fetch).mockResolvedValue(oversized);

    await expect(getWeather('42.40', '9.41', date, 'en')).rejects.toMatchObject({ status: 502 });
  });
});

// ── response size cap ────────────────────────────────────────────────────────

describe('size cap on the Open-Meteo body', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  /**
   * Response that streams `chunks` with no content-length, the way Open-Meteo
   * answers. json() is there so the old buffer-it-all path would happily parse
   * these bodies — the cap has to be what stops the oversized one.
   */
  function chunked(chunks: string[]): Response {
    let i = 0;
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => JSON.parse(chunks.join('')),
      body: {
        getReader: () => ({
          read: async () =>
            i < chunks.length
              ? { done: false, value: new TextEncoder().encode(chunks[i++]) }
              : { done: true, value: undefined },
          cancel: async () => undefined,
        }),
        cancel: async () => undefined,
      },
    } as unknown as Response;
  }

  it('WEATHER-COORD-004: a chunked body past the cap is a 502 — there is no content-length to catch it', async () => {
    const date = dateOffset(5);
    // Valid JSON, just far too much of it: the declared-length check sees nothing
    // here, so only the streaming read stops this from being buffered whole.
    const filler = '"x",'.repeat(400_000);
    vi.mocked(fetch).mockResolvedValue(chunked([`{"daily":{"time":[${filler}"${date}"]}}`]));

    await expect(getWeather('43.40', '9.42', date, 'en')).rejects.toMatchObject({ status: 502 });
  });

  it('WEATHER-COORD-005: a chunked body under the cap still parses', async () => {
    const date = dateOffset(5);
    const body = JSON.stringify({
      daily: { time: [date], temperature_2m_max: [20], temperature_2m_min: [10], weathercode: [0] },
    });
    vi.mocked(fetch).mockResolvedValue(chunked([body.slice(0, 20), body.slice(20)]));

    const result = await getWeather('44.40', '9.43', date, 'en');
    expect(result.temp).toBe(15);
  });
});
