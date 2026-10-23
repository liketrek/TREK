/**
 * WeatherMcp get_wind_forecast (WIND-MCP-001..005): the wind for a place on
 * one day over MCP, the twin of GET /api/weather/wind. The tool comes out of
 * the container with the real WindService; Open-Meteo is a stubbed fetch, so
 * nothing leaves the test. The dates are counted from the real today, because
 * the tool asks the service without a clock of its own.
 */
import type { McpContext } from '../../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import { WeatherMcp } from '../../../../src/nest/weather/weather.mcp';
import { WeatherModule } from '../../../../src/nest/weather/weather.module';
import { WIND_UNAVAILABLE_MESSAGE, WindService } from '../../../../src/nest/weather/wind.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { windQuerySchema } from '@trek/shared';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z, type ZodRawShape } from 'zod';

// The failed request's warning stays out of the log file; everything else of the logger is real.
vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logWarn: vi.fn(),
}));

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: WeatherMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [WeatherModule] });
  mcp = t.get(WeatherMcp);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = { userId: 1 } as McpContext;

/** The UTC day `days` from today, as YYYY-MM-DD. */
function dayFromToday(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

function answer(body: unknown, status = 200) {
  return vi.fn(
    async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

function openMeteo(date: string) {
  return {
    timezone: 'Europe/Lisbon',
    hourly: {
      time: [`${date}T09:00`, `${date}T15:00`],
      wind_speed_10m: [12.4, 27.6],
      wind_gusts_10m: [20.2, null],
      wind_direction_10m: [315, 290.6],
    },
    daily: { wind_speed_10m_max: [27.6], wind_gusts_10m_max: [44.8], wind_direction_10m_dominant: [300] },
  };
}

function toolOptions() {
  const entry = getEntry(WeatherMcp as unknown as ClassRef, 'getWindForecast');
  if (entry?.kind !== 'tool') throw new Error('getWindForecast is no tool');
  return entry.options;
}

describe('get_wind_forecast', () => {
  it('WIND-MCP-001: is a read of the weather for everyone signed in, on the input the REST query takes', () => {
    const options = toolOptions();
    expect(options.name).toBe('get_wind_forecast');
    expect(options.access).toEqual({ group: 'weather', mode: 'read' });
    expect(options.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    // Weather has no addon, like the route behind JwtAuthGuard alone.
    expect(options.when).toBeUndefined();
    expect(options.inputSchema).toEqual(windQuerySchema.shape);
    const input = z.object(options.inputSchema as ZodRawShape);
    expect(input.safeParse({ lat: 38.7, lng: -9.1, date: '2026-10-21' }).success).toBe(true);
    expect(input.safeParse({ lat: 91, lng: -9.1, date: '2026-10-21' }).success).toBe(false);
    expect(input.safeParse({ lat: 38.7, lng: -9.1, date: '21.10.2026' }).success).toBe(false);
  });

  it('WIND-MCP-002: answers the hours and the day of the forecast under wind', async () => {
    const date = dayFromToday(2);
    const fetchSpy = answer(openMeteo(date));
    vi.stubGlobal('fetch', fetchSpy);

    const result = read(await mcp.getWindForecast({ lat: 38.71, lng: -9.14, date }, ctx));

    expect(result.wind).toMatchObject({
      status: 'forecast',
      date,
      lat: 38.71,
      lng: -9.14,
      timezone: 'Europe/Lisbon',
      source: 'Open-Meteo',
      hours: [
        { hour: 9, speed_kmh: 12, gusts_kmh: 20, direction_deg: 315 },
        { hour: 15, speed_kmh: 28, gusts_kmh: null, direction_deg: 291 },
      ],
      day: { speed_max_kmh: 28, gusts_max_kmh: 45, direction_dominant_deg: 300 },
    });
    expect(String(fetchSpy.mock.calls[0]?.[0 as never])).toContain('latitude=38.71&longitude=-9.14');
  });

  it('WIND-MCP-003: a day gone and a day past the forecast are named without figures and without a request', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const past = read(await mcp.getWindForecast({ lat: 40, lng: -8, date: dayFromToday(-3) }, ctx));
    const far = read(await mcp.getWindForecast({ lat: 40, lng: -8, date: dayFromToday(40) }, ctx));

    expect([past.wind.status, far.wind.status]).toEqual(['past', 'beyond_horizon']);
    expect([past.wind.hours, far.wind.day]).toEqual([[], null]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('WIND-MCP-004: a source that fails is a refusal with the route sentence, not a transport error', async () => {
    vi.stubGlobal('fetch', answer({ error: true }, 503));

    const result = await mcp.getWindForecast({ lat: 41.15, lng: -8.61, date: dayFromToday(1) }, ctx);

    expect(result.isError).toBe(true);
    expect(read(result)).toEqual({ error: WIND_UNAVAILABLE_MESSAGE });
  });

  it('WIND-MCP-005: a failure without a message of its own still reads as a sentence', async () => {
    vi.spyOn(t.get(WindService), 'forecast').mockRejectedValueOnce('timeout');

    const result = await mcp.getWindForecast({ lat: 37.02, lng: -7.93, date: dayFromToday(1) }, ctx);

    expect(read(result)).toEqual({ error: 'Weather service not available.' });
  });
});
