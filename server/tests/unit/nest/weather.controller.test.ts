import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { WeatherController } from '../../../src/nest/weather/weather.controller';
import { ApiError } from '../../../src/services/weatherService';
import type { WeatherService } from '../../../src/nest/weather/weather.service';

function makeController(svc: Partial<WeatherService>) {
  return new WeatherController(svc as WeatherService);
}

/** Run `fn`, expecting it to throw an HttpException; return its { status, body }. */
async function thrown(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('WeatherController (parity with the legacy /api/weather route)', () => {
  const sample = { temp: 21, main: 'Clear', description: 'Klar', type: 'current' };

  describe('GET /api/weather', () => {
    it('400 { error } with the exact legacy message when lat/lng missing', async () => {
      const c = makeController({ get: vi.fn() });
      expect(await thrown(() => c.getWeather(undefined, '13.4'))).toEqual({
        status: 400,
        body: { error: 'Latitude and longitude are required' },
      });
    });

    it('returns the service result and defaults lang to "de" when absent', async () => {
      const get = vi.fn().mockResolvedValue(sample);
      const c = makeController({ get });
      const res = await c.getWeather('52.5', '13.4', undefined, undefined);
      expect(res).toEqual(sample);
      expect(get).toHaveBeenCalledWith('52.5', '13.4', undefined, 'de');
    });

    it('passes an explicit lang and date through unchanged', async () => {
      const get = vi.fn().mockResolvedValue(sample);
      const c = makeController({ get });
      await c.getWeather('1', '2', '2026-07-01', 'en');
      expect(get).toHaveBeenCalledWith('1', '2', '2026-07-01', 'en');
    });

    it('maps an ApiError to its status + { error: message }', async () => {
      const c = makeController({ get: vi.fn().mockRejectedValue(new ApiError(404, 'Open-Meteo API error')) });
      expect(await thrown(() => c.getWeather('1', '2'))).toEqual({
        status: 404,
        body: { error: 'Open-Meteo API error' },
      });
    });

    it('maps an unexpected error to the exact legacy 500 body', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const c = makeController({ get: vi.fn().mockRejectedValue(new Error('boom')) });
      expect(await thrown(() => c.getWeather('1', '2'))).toEqual({
        status: 500,
        body: { error: 'Error fetching weather data' },
      });
    });
  });

  describe('GET /api/weather/detailed', () => {
    it('400 { error } with the exact legacy message when date missing', async () => {
      const c = makeController({ getDetailed: vi.fn() });
      expect(await thrown(() => c.getDetailed('1', '2', undefined))).toEqual({
        status: 400,
        body: { error: 'Latitude, longitude, and date are required' },
      });
    });

    it('returns the detailed result and defaults lang to "de"', async () => {
      const getDetailed = vi.fn().mockResolvedValue(sample);
      const c = makeController({ getDetailed });
      await c.getDetailed('1', '2', '2026-07-01', undefined);
      expect(getDetailed).toHaveBeenCalledWith('1', '2', '2026-07-01', 'de');
    });

    it('maps an unexpected error to the exact detailed 500 body', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const c = makeController({ getDetailed: vi.fn().mockRejectedValue(new Error('boom')) });
      expect(await thrown(() => c.getDetailed('1', '2', '2026-07-01'))).toEqual({
        status: 500,
        body: { error: 'Error fetching detailed weather data' },
      });
    });
  });
});
