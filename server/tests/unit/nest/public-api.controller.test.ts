/**
 * PublicApiController — request shaping for /api/v1.
 *
 * The controller owns three decisions and the tests below pin all three: how a
 * trip id is parsed, how `include` is validated, and what a caller is told about a
 * trip they may not read (nothing that distinguishes it from one that does not
 * exist).
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { PUBLIC_API_INCLUDES } from '@trek/shared';
import { PublicApiController } from '../../../src/nest/public-api/public-api.controller';
import type { PublicApiService } from '../../../src/nest/public-api/public-api.service';
import type { RateLimitService } from '../../../src/nest/common/rate-limit.service';

const TRIP = {
  id: 12,
  title: 'Toskana',
  description: null,
  start_date: '2026-06-14',
  end_date: '2026-06-22',
  currency: 'EUR',
  archived: false,
  updated_at: '2026-06-01 10:00:00',
};

const ITEM = {
  name: 'Hokkaido',
  lat: 43.06,
  lng: 141.35,
  country_code: 'JP',
  notes: null,
  target_date: null,
};

/** The limiter always allows unless a test says otherwise. */
function makeController(svc: Partial<PublicApiService>, allow = true) {
  const rl = { check: vi.fn().mockReturnValue(allow) } as unknown as RateLimitService;
  return new PublicApiController(svc as PublicApiService, rl);
}

const req = (userId = 7) => ({ user: { id: userId } }) as Request;
/** A request the guard never touched — the shape the controller must refuse. */
const reqWithoutUser = () => ({}) as Request;

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('PublicApiController', () => {
  describe('GET /api/v1/bucket-list', () => {
    it('returns the caller’s wishlist and passes the id from the guard, never the query', () => {
      const listBucketList = vi.fn().mockReturnValue([ITEM]);
      expect(makeController({ listBucketList }).listBucketList(req(7))).toEqual({ items: [ITEM] });
      expect(listBucketList).toHaveBeenCalledWith(7);
    });

    it('401s when the guard left no user behind', () => {
      const listBucketList = vi.fn();
      expect(thrown(() => makeController({ listBucketList }).listBucketList(reqWithoutUser()))).toEqual({
        status: 401,
        body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
      });
      expect(listBucketList).not.toHaveBeenCalled();
    });

    it('counts against the same rate budget as everything else', () => {
      const listBucketList = vi.fn();
      expect(thrown(() => makeController({ listBucketList }, false).listBucketList(req(7))).status).toBe(429);
      expect(listBucketList).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/trips', () => {
    it('returns the accessible trips for the token owner', () => {
      const listTrips = vi.fn().mockReturnValue([TRIP]);
      expect(makeController({ listTrips }).listTrips(req(7))).toEqual({ trips: [TRIP] });
      expect(listTrips).toHaveBeenCalledWith(7);
    });

    it('returns an empty list rather than 404 when the user has no trips', () => {
      const listTrips = vi.fn().mockReturnValue([]);
      expect(makeController({ listTrips }).listTrips(req(7))).toEqual({ trips: [] });
    });

    it('401s if the guard was somehow bypassed and no user is attached', () => {
      const listTrips = vi.fn();
      expect(thrown(() => makeController({ listTrips }).listTrips(reqWithoutUser()))).toEqual({
        status: 401,
        body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
      });
      expect(listTrips).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/trips/:id', () => {
    it('passes the parsed id and user through, and defaults include to every section', () => {
      const getTrip = vi.fn().mockReturnValue(TRIP);
      const res = makeController({ getTrip }).getTrip(req(7), '12', undefined);
      expect(res).toEqual(TRIP);
      expect(getTrip).toHaveBeenCalledWith(12, 7, [...PUBLIC_API_INCLUDES]);
    });

    it('treats an empty include the same as an absent one', () => {
      const getTrip = vi.fn().mockReturnValue(TRIP);
      makeController({ getTrip }).getTrip(req(7), '12', '   ');
      expect(getTrip).toHaveBeenCalledWith(12, 7, [...PUBLIC_API_INCLUDES]);
    });

    it('narrows to the requested sections and tolerates spacing', () => {
      const getTrip = vi.fn().mockReturnValue(TRIP);
      makeController({ getTrip }).getTrip(req(7), '12', 'days, notes');
      expect(getTrip).toHaveBeenCalledWith(12, 7, ['days', 'notes']);
    });

    /**
     * The one that matters: a trip belonging to someone else answers exactly like a
     * trip that was never created. Anything else turns the endpoint into a way to
     * count another user's trips.
     */
    it('404s for a trip the caller may not read, with no hint that it exists', () => {
      const getTrip = vi.fn().mockReturnValue(null);
      expect(thrown(() => makeController({ getTrip }).getTrip(req(7), '999', undefined))).toEqual({
        status: 404,
        body: { error: 'Trip not found' },
      });
    });

    it.each([
      ['a non-numeric id', 'abc'],
      ['a numeric prefix', '12abc'],
      ['a negative id', '-1'],
      ['zero', '0'],
      ['a float', '1.5'],
      ['an empty id', ''],
      ['whitespace', ' 12 '],
      ['a sql fragment', "1 OR 1=1"],
      ['an id past the safe integer range', '9007199254740993'],
    ])('400s on %s without touching the service', (_label, raw) => {
      const getTrip = vi.fn();
      expect(thrown(() => makeController({ getTrip }).getTrip(req(7), raw, undefined)).status).toBe(400);
      expect(getTrip).not.toHaveBeenCalled();
    });

    it.each([
      ['an unknown section', 'days,everything'],
      ['a typo', 'dayz'],
      ['only commas', ',,,'],
    ])('400s on %s rather than silently dropping it', (_label, include) => {
      const getTrip = vi.fn();
      const res = thrown(() => makeController({ getTrip }).getTrip(req(7), '12', include));
      expect(res.status).toBe(400);
      expect(getTrip).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('429s the list once the budget is spent, without reaching the service', () => {
      const listTrips = vi.fn();
      const res = thrown(() => makeController({ listTrips }, false).listTrips(req(7)));
      expect(res).toEqual({ status: 429, body: { error: 'Too many requests. Please slow down.' } });
      expect(listTrips).not.toHaveBeenCalled();
    });

    it('429s the detail route the same way', () => {
      const getTrip = vi.fn();
      expect(thrown(() => makeController({ getTrip }, false).getTrip(req(7), '12', undefined)).status).toBe(429);
      expect(getTrip).not.toHaveBeenCalled();
    });
  });
});
