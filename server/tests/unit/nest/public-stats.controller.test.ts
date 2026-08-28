/**
 * GET /api/v1/stats — the aggregate widget endpoint (#1367).
 *
 * The interesting part is not the arithmetic, it is that the numbers come from
 * AtlasService rather than from a second count of their own: a widget showing 23
 * countries next to a dashboard showing 25 is the bug this endpoint exists to
 * avoid. So the service is stubbed and the assertions pin the mapping —
 * `countries.length`, not a re-derivation.
 *
 * Rate limiting and the missing-user path are shared with PublicApiController
 * (public-api-request.ts); they are exercised here too because this controller
 * lives in another module and could stop calling them without anything failing.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { PublicStatsController } from '../../../src/nest/atlas/public-stats.controller';
import type { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { PUBLIC_API_RATE_MAX_PER_MINUTE } from '../../../src/nest/public-api/public-api-request';
import type { User } from '../../../src/types';

// `null` rather than `undefined` for "no user": passing undefined would trip the
// default parameter and hand back a request that still has one.
const req = (userId: number | null = 7) =>
  ({ headers: {}, user: userId === null ? undefined : ({ id: userId } as User) }) as Request;

const travel = (o: Partial<ReturnType<AtlasService['getTravelStats']>> = {}) => ({
  countries: ['JP', 'IT'],
  cities: ['tokyo', 'kyoto', 'rome'],
  coords: [],
  totalTrips: 4,
  totalDays: 31,
  totalPlaces: 52,
  totalDistanceKm: 18402,
  ...o,
});

function ctl(atlas: Partial<AtlasService> = {}, rl = new RateLimitService()) {
  return new PublicStatsController(
    { getTravelStats: vi.fn(() => travel()), lastTrip: vi.fn(() => null), ...atlas } as unknown as AtlasService,
    rl,
  );
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('PublicStatsController', () => {
  it('PUBSTATS-001: reports counts, not the arrays behind them', () => {
    expect(ctl().stats(req())).toEqual({
      total_trips: 4,
      total_countries: 2,
      total_cities: 3,
      total_places: 52,
      total_days: 31,
      total_distance_km: 18402,
      last_trip: null,
    });
  });

  it('PUBSTATS-002: passes the authenticated user through to the service', () => {
    const getTravelStats = vi.fn(() => travel());
    const lastTrip = vi.fn(() => null);
    ctl({ getTravelStats, lastTrip } as unknown as Partial<AtlasService>).stats(req(42));
    expect(getTravelStats).toHaveBeenCalledWith(42);
    expect(lastTrip).toHaveBeenCalledWith(42);
  });

  it('PUBSTATS-003: last_trip carries the dominant country as the head of the list', () => {
    const lastTrip = vi.fn(() => ({
      title: 'Interrail', start_date: '2026-03-01', end_date: '2026-03-12', countries: ['CZ', 'AT'],
    }));
    const out = ctl({ lastTrip } as unknown as Partial<AtlasService>).stats(req());
    expect(out.last_trip).toEqual({
      title: 'Interrail',
      start_date: '2026-03-01',
      end_date: '2026-03-12',
      country: 'CZ',
      countries: ['CZ', 'AT'],
    });
  });

  it('PUBSTATS-004: an ungeocoded last trip reports country null rather than a wrong one', () => {
    const lastTrip = vi.fn(() => ({ title: 'Roadtrip', start_date: null, end_date: null, countries: [] }));
    const out = ctl({ lastTrip } as unknown as Partial<AtlasService>).stats(req());
    expect(out.last_trip).toMatchObject({ country: null, countries: [] });
  });

  it('PUBSTATS-005: shares one rate-limit budget with the rest of /api/v1', () => {
    const rl = new RateLimitService();
    const c = ctl({}, rl);
    for (let i = 0; i < PUBLIC_API_RATE_MAX_PER_MINUTE; i++) c.stats(req());
    expect(thrown(() => c.stats(req()))).toEqual({
      status: 429,
      body: { error: 'Too many requests. Please slow down.' },
    });
    // A different caller still gets their own budget.
    expect(() => c.stats(req(8))).not.toThrow();
  });

  it('PUBSTATS-006: a request with no resolved user is a 401, not a crash', () => {
    const getTravelStats = vi.fn(() => travel());
    expect(thrown(() => ctl({ getTravelStats } as unknown as Partial<AtlasService>).stats(req(null)))).toEqual({
      status: 401,
      body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
    });
    // The guard is what should have stopped this; no data was read on the way out.
    expect(getTravelStats).not.toHaveBeenCalled();
  });

  it('PUBSTATS-007: the class is listed in its module controllers', async () => {
    const { AtlasModule } = await import('../../../src/nest/atlas/atlas.module');
    const controllers = Reflect.getMetadata('controllers', AtlasModule) as unknown[];
    expect(controllers).toContain(PublicStatsController);
  });
});
