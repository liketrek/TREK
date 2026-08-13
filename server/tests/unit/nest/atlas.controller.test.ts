import { describe, it, expect, vi } from 'vitest';
import { HttpException, RequestMethod } from '@nestjs/common';
import type { Response } from 'express';
import { AtlasController } from '../../../src/nest/atlas/atlas.controller';
import { TravelStatsController } from '../../../src/nest/atlas/travel-stats.controller';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { BucketItemExistsError } from '../../../src/nest/atlas/atlas.service';
import type { AtlasService } from '../../../src/nest/atlas/atlas.service';
import type { User } from '../../../src/types';

const user = { id: 8 } as User;

function makeController(svc: Partial<AtlasService>) {
  return new AtlasController(svc as AtlasService);
}

function makeRes() {
  return { setHeader: vi.fn(), send: vi.fn(), json: vi.fn() } as unknown as Response & {
    setHeader: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('AtlasController (parity with the legacy /api/addons/atlas route)', () => {
  it('GET /stats delegates with the user id', () => {
    const stats = vi.fn().mockReturnValue({ countries: 3 });
    expect(makeController({ stats }).stats(user)).toEqual({ countries: 3 });
    expect(stats).toHaveBeenCalledWith(8);
  });

  describe('GET /regions/geo', () => {
    it('returns an empty FeatureCollection without a cache header when no countries given', async () => {
      const regionGeo = vi.fn();
      const res = makeRes();
      const out = await makeController({ regionGeo }).regionGeo(undefined, res);
      expect(out).toEqual({ type: 'FeatureCollection', features: [] });
      expect(regionGeo).not.toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('caches a non-empty result for a day', async () => {
      const regionGeo = vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [{ id: 1 }] });
      const res = makeRes();
      const out = await makeController({ regionGeo }).regionGeo('DE,FR', res);
      expect(out).toEqual({ type: 'FeatureCollection', features: [{ id: 1 }] });
      expect(regionGeo).toHaveBeenCalledWith(['DE', 'FR']);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    });
  });

  it('GET /countries/geo serves the gzipped admin-0 bundle with Content-Encoding', () => {
    const gz = Buffer.from('gzipped-bytes');
    const countryGeoGz = vi.fn().mockReturnValue(gz);
    const res = makeRes();
    makeController({ countryGeoGz }).countryGeo(res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(res.send).toHaveBeenCalledWith(gz);
  });

  it('GET /countries/geo falls back to an empty FeatureCollection when the bundle is missing', () => {
    const countryGeoGz = vi.fn().mockReturnValue(null);
    const res = makeRes();
    makeController({ countryGeoGz }).countryGeo(res);
    expect(res.json).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  describe('country', () => {
    it('GET /country/:code upper-cases the code', () => {
      const countryPlaces = vi.fn().mockReturnValue([]);
      makeController({ countryPlaces }).countryPlaces(user, 'de');
      expect(countryPlaces).toHaveBeenCalledWith(8, 'DE');
    });

    it('POST mark returns success and upper-cases', () => {
      const markCountry = vi.fn();
      expect(makeController({ markCountry }).markCountry(user, 'de')).toEqual({ success: true });
      expect(markCountry).toHaveBeenCalledWith(8, 'DE');
    });

    it('DELETE mark returns success', () => {
      const unmarkCountry = vi.fn();
      expect(makeController({ unmarkCountry }).unmarkCountry(user, 'FR')).toEqual({ success: true });
    });
  });

  describe('region', () => {
    // The legacy 'name and country_code are required' 400 is now produced by
    // the global ZodValidationPipe (atlas.dto.ts / markRegionRequestSchema)
    // before the handler runs — covered by the e2e suite.

    it('marks a region, upper-casing both codes', () => {
      const markRegion = vi.fn();
      expect(makeController({ markRegion }).markRegion(user, 'by', { name: 'Bavaria', country_code: 'de' })).toEqual({ success: true });
      expect(markRegion).toHaveBeenCalledWith(8, 'BY', 'Bavaria', 'DE');
    });
  });

  describe('bucket list', () => {
    it('GET wraps the items', () => {
      const bucketList = vi.fn().mockReturnValue([{ id: 1 }]);
      expect(makeController({ bucketList }).bucketList(user)).toEqual({ items: [{ id: 1 }] });
    });

    it('400 on create with a blank name', () => {
      const createBucketItem = vi.fn();
      return thrown(() => makeController({ createBucketItem }).createBucketItem(user, { name: '  ' })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Name is required' } }));
    });

    it('201-shape create returns { item }', () => {
      const createBucketItem = vi.fn().mockReturnValue({ id: 1, name: 'Tokyo' });
      expect(makeController({ createBucketItem }).createBucketItem(user, { name: 'Tokyo', lat: 35, lng: 139 }))
        .toEqual({ item: { id: 1, name: 'Tokyo' } });
      expect(createBucketItem).toHaveBeenCalledWith(8, { name: 'Tokyo', lat: 35, lng: 139, country_code: undefined, notes: undefined, target_date: undefined });
    });

    it('404 on update of a missing item', () => {
      const updateBucketItem = vi.fn().mockReturnValue(null);
      return thrown(() => makeController({ updateBucketItem }).updateBucketItem(user, '9', { name: 'X' })).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Item not found' } }));
    });

    it('updates an existing item', () => {
      const updateBucketItem = vi.fn().mockReturnValue({ id: 1, name: 'Kyoto' });
      expect(makeController({ updateBucketItem }).updateBucketItem(user, '1', { name: 'Kyoto' }))
        .toEqual({ item: { id: 1, name: 'Kyoto' } });
    });

    it('409 when the service refuses a duplicate create (#1898)', () => {
      const createBucketItem = vi.fn(() => { throw new BucketItemExistsError(); });
      return thrown(() => makeController({ createBucketItem }).createBucketItem(user, { name: 'Japan' })).then((r) =>
        expect(r).toEqual({ status: 409, body: { error: 'Already on your bucket list' } }));
    });

    it('409 when the service refuses a duplicate update (#1898)', () => {
      const updateBucketItem = vi.fn(() => { throw new BucketItemExistsError(); });
      return thrown(() => makeController({ updateBucketItem }).updateBucketItem(user, '1', { target_date: '2027-05' })).then((r) =>
        expect(r).toEqual({ status: 409, body: { error: 'Already on your bucket list' } }));
    });

    it('lets any other create/update failure through untouched', () => {
      const boom = new Error('disk on fire');
      const createBucketItem = vi.fn(() => { throw boom; });
      expect(() => makeController({ createBucketItem }).createBucketItem(user, { name: 'Japan' })).toThrow(boom);
      const updateBucketItem = vi.fn(() => { throw boom; });
      expect(() => makeController({ updateBucketItem }).updateBucketItem(user, '1', { name: 'Japan' })).toThrow(boom);
    });

    it('404 on delete of a missing item', () => {
      const deleteBucketItem = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ deleteBucketItem }).deleteBucketItem(user, '9')).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Item not found' } }));
    });

    it('deletes an existing item', () => {
      const deleteBucketItem = vi.fn().mockReturnValue(true);
      expect(makeController({ deleteBucketItem }).deleteBucketItem(user, '1')).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// TravelStatsController — GET /api/auth/travel-stats.
//
// The path lives under /api/auth on purpose (the client calls it there and
// moving it would break); the code sits in atlas/ because getTravelStats reads
// Atlas data. These cases pin both halves: the delegation, and the fact that
// the controller keeps the auth prefix.
// ---------------------------------------------------------------------------

describe('TravelStatsController', () => {
  it('ATLAS-TRAVEL-001: delegates to AtlasService.getTravelStats with the caller id', () => {
    const getTravelStats = vi.fn().mockReturnValue({ countries: ['JP'], totalTrips: 2 });
    const controller = new TravelStatsController({ getTravelStats } as unknown as AtlasService);

    expect(controller.travelStats(user)).toEqual({ countries: ['JP'], totalTrips: 2 });
    expect(getTravelStats).toHaveBeenCalledWith(8);
  });

  it('ATLAS-TRAVEL-002: passes the payload through untouched', () => {
    const payload = { countries: [], cities: [], coords: [], totalTrips: 0, totalDays: 0, totalPlaces: 0, totalDistanceKm: 0 };
    const controller = new TravelStatsController({ getTravelStats: () => payload } as unknown as AtlasService);

    expect(controller.travelStats(user)).toBe(payload);
  });

  it('ATLAS-TRAVEL-003: still answers on /api/auth/travel-stats, so the move is not a breaking change', () => {
    expect(Reflect.getMetadata('path', TravelStatsController)).toBe('api/auth');
    expect(Reflect.getMetadata('path', TravelStatsController.prototype.travelStats)).toBe('travel-stats');
    expect(Reflect.getMetadata('method', TravelStatsController.prototype.travelStats)).toBe(RequestMethod.GET);
  });

  // No module-registration check here: importing AtlasModule drags AtlasMcp and
  // the whole MCP SDK chain into what is otherwise a plain controller test, and
  // it fails to resolve when the file runs on its own. PROFILE-014 covers the
  // registration better anyway — it calls the route through the full app.
  it('ATLAS-TRAVEL-004: keeps the JwtAuthGuard the route had on AuthController', () => {
    // Array shape asserted first on purpose: expect(undefined).toContain(SomeClass)
    // passes in this vitest version, so the plain form would stop guarding the
    // moment the decorator disappeared. Same reason module-providers.ts exists.
    const guards = Reflect.getMetadata('__guards__', TravelStatsController) as unknown[] | undefined;
    expect(Array.isArray(guards)).toBe(true);
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard]));
  });

});
