/**
 * PAD-08: the wind forecast for a paddle tour's day. WIND-001..006.
 *
 * Only a forecast is ever answered: a past day and one beyond the forecast's
 * reach say so without figures, a missing value stays null, and a failed
 * request is a 502 of its own rather than an empty forecast.
 */
import { DomainError } from '../../../../src/nest/common/domain-error';
import { WIND_UNAVAILABLE_MESSAGE, WindService } from '../../../../src/nest/weather/wind.service';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({ logWarn: vi.fn() }));

const NOW = Date.parse('2026-10-16T10:00:00Z');

function openMeteo(overrides: Record<string, unknown> = {}) {
  return {
    timezone: 'Europe/Berlin',
    hourly: {
      time: ['2026-10-18T00:00', '2026-10-18T01:00', '2026-10-18T14:00'],
      wind_speed_10m: [5.4, null, 18.6],
      wind_gusts_10m: [9.1, null, 41.2],
      wind_direction_10m: [270, null, 225.4],
    },
    daily: { wind_speed_10m_max: [18.6], wind_gusts_10m_max: [41.2], wind_direction_10m_dominant: [240] },
    ...overrides,
  };
}

function answer(body: unknown, status = 200) {
  return vi.fn(
    async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('WindService', () => {
  it('WIND-001: reads mean wind, gusts and direction per hour, and the day by its maxima and dominant direction', async () => {
    const fetchSpy = answer(openMeteo());
    vi.stubGlobal('fetch', fetchSpy);
    const result = await new WindService().forecast({ lat: 47.55, lng: 9.68, date: '2026-10-18' }, NOW);
    expect(result).toMatchObject({
      status: 'forecast',
      timezone: 'Europe/Berlin',
      source: 'Open-Meteo',
      horizon_days: 16,
    });
    expect(result.hours).toEqual([
      { hour: 0, speed_kmh: 5, gusts_kmh: 9, direction_deg: 270 },
      { hour: 1, speed_kmh: null, gusts_kmh: null, direction_deg: null },
      { hour: 14, speed_kmh: 19, gusts_kmh: 41, direction_deg: 225 },
    ]);
    expect(result.day).toEqual({ speed_max_kmh: 19, gusts_max_kmh: 41, direction_dominant_deg: 240 });
    const url = String(fetchSpy.mock.calls[0]?.[0 as never]);
    expect(url).toContain('start_date=2026-10-18');
    expect(url).not.toContain('archive');
  });

  it('WIND-002: a past day and a day beyond the forecast are named, with no figures and no request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const service = new WindService();
    const past = await service.forecast({ lat: 47, lng: 9, date: '2026-10-15' }, NOW);
    const far = await service.forecast({ lat: 47, lng: 9, date: '2026-11-20' }, NOW);
    expect([past.status, far.status]).toEqual(['past', 'beyond_horizon']);
    expect([past.hours, far.hours, past.day, far.day]).toEqual([[], [], null, null]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('WIND-003: the last day the forecast reaches is still asked', async () => {
    vi.stubGlobal('fetch', answer(openMeteo()));
    const result = await new WindService().forecast({ lat: 47, lng: 9, date: '2026-10-31' }, NOW);
    expect(result.status).toBe('forecast');
  });

  it('WIND-004: gusts and directions the source leaves out stay unknown, never calm', async () => {
    vi.stubGlobal(
      'fetch',
      answer(
        openMeteo({
          hourly: { time: ['2026-10-18T09:00'], wind_speed_10m: [12] },
          daily: { wind_speed_10m_max: [12] },
        }),
      ),
    );
    const result = await new WindService().forecast({ lat: 47, lng: 9, date: '2026-10-18' }, NOW);
    expect(result.hours).toEqual([{ hour: 9, speed_kmh: 12, gusts_kmh: null, direction_deg: null }]);
    expect(result.day).toEqual({ speed_max_kmh: 12, gusts_max_kmh: null, direction_dominant_deg: null });
  });

  it('WIND-005: a failed or malformed answer is a 502 of its own', async () => {
    const service = new WindService();
    vi.stubGlobal('fetch', answer({ reason: 'down' }, 503));
    await expect(service.forecast({ lat: 47, lng: 9, date: '2026-10-18' }, NOW)).rejects.toBeInstanceOf(DomainError);
    vi.stubGlobal('fetch', answer({ hourly: 'nonsense' }));
    await expect(service.forecast({ lat: 47, lng: 9, date: '2026-10-19' }, NOW)).rejects.toMatchObject({
      code: 'wind_unavailable',
      status: 502,
      publicMessage: WIND_UNAVAILABLE_MESSAGE,
    });
  });

  it('WIND-006: one place and day is asked once while fresh, and once for callers asking together', async () => {
    const fetchSpy = answer(openMeteo());
    vi.stubGlobal('fetch', fetchSpy);
    const service = new WindService();
    const query = { lat: 47.551, lng: 9.682, date: '2026-10-18' };
    await Promise.all([service.forecast(query, NOW), service.forecast(query, NOW)]);
    await service.forecast({ ...query, lat: 47.552 }, NOW + 60_000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    await service.forecast(query, NOW + 31 * 60_000);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
