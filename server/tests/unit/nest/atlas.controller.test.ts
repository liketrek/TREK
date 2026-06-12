import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { AtlasController } from '../../../src/nest/atlas/atlas.controller';
import type { AtlasService } from '../../../src/nest/atlas/atlas.service';
import type { User } from '../../../src/types';

const user = { id: 8 } as User;

function makeController(svc: Partial<AtlasService>) {
  return new AtlasController(svc as AtlasService);
}

function makeRes() {
  return { setHeader: vi.fn() } as unknown as Response & { setHeader: ReturnType<typeof vi.fn> };
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

  it('GET /countries/geo delegates to the service', () => {
    const fc = { type: 'FeatureCollection', features: [{ id: 'NO' }] };
    const countryGeo = vi.fn().mockReturnValue(fc);
    expect(makeController({ countryGeo }).countryGeo()).toBe(fc);
    expect(countryGeo).toHaveBeenCalledWith();
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
    it('400 when name or country_code is missing', () => {
      const markRegion = vi.fn();
      return thrown(() => makeController({ markRegion }).markRegion(user, 'by', undefined, 'DE')).then((r) =>
        expect(r).toEqual({ status: 400, body: { error: 'name and country_code are required' } }));
    });

    it('marks a region, upper-casing both codes', () => {
      const markRegion = vi.fn();
      expect(makeController({ markRegion }).markRegion(user, 'by', 'Bavaria', 'de')).toEqual({ success: true });
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
