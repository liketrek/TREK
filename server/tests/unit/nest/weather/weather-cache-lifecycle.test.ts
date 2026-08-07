/**
 * The weather cache sweep's lifecycle — WEATHER-SWEEP-001..005.
 *
 * The sweep used to be a bare setInterval at module scope: every process that
 * imported weather.impl started a five-minute timer, and nothing could stop it
 * because there was nothing to call. It is start/stop now, owned by
 * WeatherService's onModuleInit/onModuleDestroy — so it needs tests that the
 * old shape could not have had.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { startCacheCleanup, stopCacheCleanup, getWeather } from '../../../../src/nest/weather/weather.impl';
import { WeatherService } from '../../../../src/nest/weather/weather.service';

beforeEach(() => {
  vi.useFakeTimers();
  stopCacheCleanup(); // start from a known state whatever ran before
});

afterEach(() => {
  stopCacheCleanup();
  vi.useRealTimers();
});

describe('cache sweep lifecycle', () => {
  it('WEATHER-SWEEP-001: start schedules exactly one interval', () => {
    const setInterval = vi.spyOn(globalThis, 'setInterval');

    startCacheCleanup();

    expect(setInterval).toHaveBeenCalledOnce();
    expect(setInterval.mock.calls[0][1]).toBe(5 * 60 * 1000);
  });

  it('WEATHER-SWEEP-002: starting twice does not stack a second timer', () => {
    const setInterval = vi.spyOn(globalThis, 'setInterval');

    startCacheCleanup();
    startCacheCleanup();

    expect(setInterval).toHaveBeenCalledOnce();
  });

  it('WEATHER-SWEEP-003: the timer is unref-ed, so a sweep never holds the process open', () => {
    const unref = vi.fn();
    vi.spyOn(globalThis, 'setInterval').mockReturnValue({ unref } as unknown as NodeJS.Timeout);

    startCacheCleanup();

    expect(unref).toHaveBeenCalledOnce();
  });

  it('WEATHER-SWEEP-004: stop clears the timer and is idempotent', () => {
    startCacheCleanup();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    stopCacheCleanup();
    expect(vi.getTimerCount()).toBe(0);

    expect(() => stopCacheCleanup()).not.toThrow();
  });

  it('WEATHER-SWEEP-005: stop then start schedules again', () => {
    startCacheCleanup();
    stopCacheCleanup();
    startCacheCleanup();

    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
});

describe('what the sweep actually does', () => {
  it('WEATHER-SWEEP-007: an expired entry is gone after a sweep, without anyone asking for it', async () => {
    const date = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const body = {
      daily: { time: [date], temperature_2m_max: [20], temperature_2m_min: [10], weathercode: [0] },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: vi.fn().mockResolvedValue(body),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    try {
      await getWeather('44.44', '8.88', date, 'en');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      startCacheCleanup();
      // Past the forecast TTL (1h) and past one sweep interval (5min), so the
      // sweep — not a later read — is what evicts the entry.
      vi.advanceTimersByTime(60 * 60 * 1000 + 5 * 60 * 1000 + 1000);

      await getWeather('44.44', '8.88', date, 'en');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('WeatherService lifecycle hooks', () => {
  it('WEATHER-SWEEP-006: onModuleInit starts the sweep and onModuleDestroy stops it', () => {
    const svc = new WeatherService();

    svc.onModuleInit();
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    svc.onModuleDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
