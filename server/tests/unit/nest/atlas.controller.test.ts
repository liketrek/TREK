import type { AtlasWritesService } from '../../../src/nest/atlas/atlas-writes.service';
import { AtlasController } from '../../../src/nest/atlas/atlas.controller';
import { BucketItemExistsError } from '../../../src/nest/atlas/atlas.service';
import type { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { TravelStatsController } from '../../../src/nest/atlas/travel-stats.controller';
import { JwtAuthGuard } from '../../../src/nest/auth-core/jwt-auth.guard';
import type { User } from '../../../src/types';
import { HttpException, RequestMethod } from '@nestjs/common';

import type { Response } from 'express';
import { describe, it, expect, vi } from 'vitest';
import zlib from 'zlib';

const user = { id: 8 } as User;

/** The reads come from AtlasService, the writes from AtlasWritesService; one stub stands in for both. */
function makeController(svc: Partial<AtlasService> & Partial<AtlasWritesService>) {
  return new AtlasController(svc as unknown as AtlasService, svc as unknown as AtlasWritesService);
}

function makeRes() {
  const res = { setHeader: vi.fn(), send: vi.fn(), sendFile: vi.fn(), json: vi.fn(), type: vi.fn() };
  res.type.mockReturnValue(res);
  return res as unknown as Response & {
    setHeader: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    sendFile: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    type: ReturnType<typeof vi.fn>;
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
  it('GET /stats delegates with the user id', async () => {
    const stats = vi.fn().mockReturnValue({ countries: 3 });
    expect(await makeController({ stats }).stats(user)).toEqual({ countries: 3 });
    expect(stats).toHaveBeenCalledWith(8);
  });

  // The region routes read the committed per-country files (server/assets/atlas/admin1).
  type RegionFeatures = { features: { properties: { iso_a2: string } }[] };
  const countriesOf = (geo: RegionFeatures) => new Set(geo.features.map((f) => f.properties.iso_a2));

  describe('GET /regions/geo', () => {
    it('returns an empty FeatureCollection without a cache header when no countries given', () => {
      const res = makeRes();
      makeController({}).regionGeo(undefined, res);
      expect(res.json).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('sends the countries joined into one FeatureCollection and caches them for a day', () => {
      const res = makeRes();
      makeController({}).regionGeo('DE,FR', res);
      expect(res.type).toHaveBeenCalledWith('application/json');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      const body = JSON.parse(String(res.send.mock.calls[0][0])) as RegionFeatures;
      expect(countriesOf(body)).toEqual(new Set(['DE', 'FR']));
    });
  });

  describe('GET /regions/geo/:code', () => {
    it("serves the country's gzipped admin-1 file with Content-Encoding and a day of cache", async () => {
      const res = makeRes();
      await makeController({}).regionGeoForCountry({ code: 'NO' }, res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      const body = JSON.parse(zlib.gunzipSync(res.send.mock.calls[0][0] as Buffer).toString()) as RegionFeatures;
      expect(countriesOf(body)).toEqual(new Set(['NO']));
    });

    it('answers a country without regions with a cached empty FeatureCollection', async () => {
      const res = makeRes();
      await makeController({}).regionGeoForCountry({ code: 'ZZ' }, res);
      expect(res.json).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
    });
  });

  it('GET /countries/geo sends the gzipped admin-0 file from disk with Content-Encoding', () => {
    const countryGeoFile = vi.fn().mockReturnValue('/srv/trek/assets/atlas/admin0.geojson.gz');
    const res = makeRes();
    makeController({ countryGeoFile }).countryGeo(res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(res.sendFile).toHaveBeenCalledWith('admin0.geojson.gz', {
      root: '/srv/trek/assets/atlas',
      acceptRanges: false,
      lastModified: false,
    });
  });

  it('GET /countries/geo falls back to an empty FeatureCollection when the bundle is missing', () => {
    const countryGeoFile = vi.fn().mockReturnValue(null);
    const res = makeRes();
    makeController({ countryGeoFile }).countryGeo(res);
    expect(res.json).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  describe('country', () => {
    it('GET /country/:code upper-cases the code', async () => {
      const countryPlaces = vi.fn().mockReturnValue([]);
      await makeController({ countryPlaces }).countryPlaces(user, 'de');
      expect(countryPlaces).toHaveBeenCalledWith(8, 'DE');
    });

    it('POST mark returns success and upper-cases', async () => {
      const markCountry = vi.fn();
      expect(await makeController({ markCountry }).markCountry(user, 'de')).toEqual({ success: true });
      expect(markCountry).toHaveBeenCalledWith(8, 'DE', undefined);
    });

    it('DELETE mark returns success', async () => {
      const unmarkCountry = vi.fn();
      expect(await makeController({ unmarkCountry }).unmarkCountry(user, 'FR')).toEqual({ success: true });
    });

    it('ATLAS-CTRL-001: every write hands on X-Socket-Id, so the tab that asked is left out of atlas:changed', async () => {
      const writes = {
        markCountry: vi.fn(),
        unmarkCountry: vi.fn(),
        markRegion: vi.fn(),
        unmarkRegion: vi.fn(),
        createBucketItem: vi.fn().mockReturnValue({ id: 1 }),
        updateBucketItem: vi.fn().mockReturnValue({ id: 1 }),
        deleteBucketItem: vi.fn().mockReturnValue(true),
      };
      const c = makeController(writes);
      await c.markCountry(user, 'de', 'sock-1');
      await c.unmarkCountry(user, 'de', 'sock-1');
      await c.markRegion(user, 'by', { name: 'Bavaria', country_code: 'de' }, 'sock-1');
      await c.unmarkRegion(user, 'by', 'sock-1');
      await c.createBucketItem(user, { name: 'Tokyo' }, 'sock-1');
      await c.updateBucketItem(user, '1', { name: 'Kyoto' }, 'sock-1');
      await c.deleteBucketItem(user, '1', 'sock-1');
      for (const write of Object.values(writes)) expect(write.mock.calls[0]?.at(-1)).toBe('sock-1');
    });
  });

  describe('region', () => {
    // The legacy 'name and country_code are required' 400 is now produced by
    // the global ZodValidationPipe (atlas.dto.ts / markRegionRequestSchema)
    // before the handler runs — covered by the e2e suite.

    it('marks a region, upper-casing both codes', async () => {
      const markRegion = vi.fn();
      expect(
        await makeController({ markRegion }).markRegion(user, 'by', { name: 'Bavaria', country_code: 'de' }),
      ).toEqual({ success: true });
      expect(markRegion).toHaveBeenCalledWith(8, 'BY', 'Bavaria', 'DE', undefined);
    });
  });

  describe('bucket list', () => {
    it('GET wraps the items', async () => {
      const bucketList = vi.fn().mockReturnValue([{ id: 1 }]);
      expect(await makeController({ bucketList }).bucketList(user)).toEqual({ items: [{ id: 1 }] });
    });

    it('400 on create with a blank name', () => {
      const createBucketItem = vi.fn();
      return thrown(() => makeController({ createBucketItem }).createBucketItem(user, { name: '  ' })).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'Name is required' } }),
      );
    });

    it('201-shape create returns { item }', async () => {
      const createBucketItem = vi.fn().mockReturnValue({ id: 1, name: 'Tokyo' });
      expect(
        await makeController({ createBucketItem }).createBucketItem(user, { name: 'Tokyo', lat: 35, lng: 139 }),
      ).toEqual({ item: { id: 1, name: 'Tokyo' } });
      expect(createBucketItem).toHaveBeenCalledWith(
        8,
        {
          name: 'Tokyo',
          lat: 35,
          lng: 139,
          country_code: undefined,
          notes: undefined,
          target_date: undefined,
        },
        undefined,
      );
    });

    it('forwards a wished-for region, as the MCP tool does (#1901)', async () => {
      const createBucketItem = vi.fn().mockReturnValue({ id: 2 });
      await makeController({ createBucketItem }).createBucketItem(user, {
        name: 'Bayern',
        country_code: 'DE',
        region_code: 'DE-BY',
      });
      expect(createBucketItem).toHaveBeenCalledWith(
        8,
        expect.objectContaining({ country_code: 'DE', region_code: 'DE-BY' }),
        undefined,
      );
    });

    it('404 on update of a missing item', () => {
      const updateBucketItem = vi.fn().mockReturnValue(null);
      return thrown(() => makeController({ updateBucketItem }).updateBucketItem(user, '9', { name: 'X' })).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Item not found' } }),
      );
    });

    it('updates an existing item', async () => {
      const updateBucketItem = vi.fn().mockReturnValue({ id: 1, name: 'Kyoto' });
      expect(await makeController({ updateBucketItem }).updateBucketItem(user, '1', { name: 'Kyoto' })).toEqual({
        item: { id: 1, name: 'Kyoto' },
      });
    });

    it('409 when the service refuses a duplicate create (#1898)', () => {
      const createBucketItem = vi.fn(() => {
        throw new BucketItemExistsError();
      });
      return thrown(() => makeController({ createBucketItem }).createBucketItem(user, { name: 'Japan' })).then((r) =>
        expect(r).toEqual({ status: 409, body: { error: 'Already on your bucket list' } }),
      );
    });

    it('409 when the service refuses a duplicate update (#1898)', () => {
      const updateBucketItem = vi.fn(() => {
        throw new BucketItemExistsError();
      });
      return thrown(() =>
        makeController({ updateBucketItem }).updateBucketItem(user, '1', { target_date: '2027-05' }),
      ).then((r) => expect(r).toEqual({ status: 409, body: { error: 'Already on your bucket list' } }));
    });

    it('lets any other create/update failure through untouched', async () => {
      const boom = new Error('disk on fire');
      const createBucketItem = vi.fn(() => {
        throw boom;
      });
      await expect(makeController({ createBucketItem }).createBucketItem(user, { name: 'Japan' })).rejects.toThrow(
        boom,
      );
      const updateBucketItem = vi.fn(() => {
        throw boom;
      });
      await expect(makeController({ updateBucketItem }).updateBucketItem(user, '1', { name: 'Japan' })).rejects.toThrow(
        boom,
      );
    });

    it('404 on delete of a missing item', () => {
      const deleteBucketItem = vi.fn().mockReturnValue(false);
      return thrown(() => makeController({ deleteBucketItem }).deleteBucketItem(user, '9')).then((r) =>
        expect(r).toEqual({ status: 404, body: { error: 'Item not found' } }),
      );
    });

    it('deletes an existing item', async () => {
      const deleteBucketItem = vi.fn().mockReturnValue(true);
      expect(await makeController({ deleteBucketItem }).deleteBucketItem(user, '1')).toEqual({ success: true });
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
  it('ATLAS-TRAVEL-001: delegates to AtlasService.getTravelStats with the caller id', async () => {
    const getTravelStats = vi.fn().mockReturnValue({ countries: ['JP'], totalTrips: 2 });
    const controller = new TravelStatsController({ getTravelStats } as unknown as AtlasService);

    expect(await controller.travelStats(user)).toEqual({ countries: ['JP'], totalTrips: 2 });
    expect(getTravelStats).toHaveBeenCalledWith(8);
  });

  it('ATLAS-TRAVEL-002: passes the payload through untouched', async () => {
    const payload = {
      countries: [],
      cities: [],
      coords: [],
      totalTrips: 0,
      totalDays: 0,
      totalPlaces: 0,
      totalDistanceKm: 0,
    };
    const controller = new TravelStatsController({ getTravelStats: () => payload } as unknown as AtlasService);

    expect(await controller.travelStats(user)).toBe(payload);
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
