/**
 * PlacePhotoResolver on its own: the outcomes of the two photo sources mapped
 * onto the negative cache. The full getPlacePhoto flow (cache hit, in-flight
 * dedupe, Google then Wikimedia) runs through MapsService in
 * maps.service.test.ts; this pins the cases a source answer alone decides.
 */
import { describe, expect, it, vi } from 'vitest';
import { PlacePhotoResolver } from '../../../src/nest/maps/place-photo.resolver';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { GooglePlacesClient } from '../../../src/nest/maps/providers/google-places.provider';
import type { WikimediaClient } from '../../../src/nest/maps/providers/wikimedia.client';
import type { PlacesProviderSelector } from '../../../src/nest/maps/places-provider.selector';

function cache(over: Record<string, unknown> = {}) {
  return {
    get: vi.fn(async () => null),
    getErrored: vi.fn(async () => false),
    getInFlight: vi.fn(() => undefined),
    setInFlight: vi.fn(),
    markError: vi.fn(async () => {}),
    put: vi.fn(async (id: string, _bytes: Buffer, attribution: string | null) => ({ photoUrl: `/p/${id}`, filePath: '/x', attribution })),
    ...over,
  };
}

function resolver(c: ReturnType<typeof cache>, wikiOutcome: unknown, key: string | null = null, googleOutcome: unknown = { kind: 'none' }) {
  const places = { setImageUrlIfUnset: vi.fn(async () => 1) };
  const google = { firstPhoto: vi.fn(async () => googleOutcome) };
  const wiki = { downloadPhoto: vi.fn(async () => wikiOutcome) };
  const selector = { getMapsKey: vi.fn(async () => key) };
  const r = new PlacePhotoResolver(
    c as unknown as PlacePhotoCacheService,
    places as unknown as PlacesRepository,
    google as unknown as GooglePlacesClient,
    wiki as unknown as WikimediaClient,
    selector as unknown as PlacesProviderSelector,
  );
  return { r, places, google, wiki };
}

describe('PlacePhotoResolver', () => {
  it('PHOTO-R-001: a Wikimedia picture the disk cache cannot store counts as a provider failure', async () => {
    const c = cache({ put: vi.fn(async () => { throw new Error('disk full'); }) });
    const { r } = resolver(c, { kind: 'photo', bytes: Buffer.from([1]), attribution: 'A' });
    expect(await r.resolve(1, 'coords:1,2', 1, 2, 'X')).toEqual({ photoUrl: null, attribution: null });
    expect(c.markError).toHaveBeenCalledWith('coords:1,2', 'provider-error');
  });

  it('PHOTO-R-002: nothing anywhere is remembered as a plain miss', async () => {
    const c = cache();
    const { r } = resolver(c, { kind: 'none' });
    expect(await r.resolve(1, 'coords:1,2', 1, 2)).toEqual({ photoUrl: null, attribution: null });
    expect(c.markError).toHaveBeenCalledWith('coords:1,2', 'no-photo');
  });

  it('PHOTO-R-003: a Google photo is stored, its proxy URL persisted, and Wikimedia never asked', async () => {
    const c = cache();
    const { r, places, wiki } = resolver(c, { kind: 'none' }, 'key', { kind: 'photo', bytes: Buffer.from([1]), attribution: 'G' });
    expect(await r.resolve(1, 'ChIJabc', 1, 2)).toEqual({ photoUrl: '/api/maps/place-photo/ChIJabc/bytes', attribution: 'G' });
    expect(places.setImageUrlIfUnset).toHaveBeenCalledWith('ChIJabc', '/p/ChIJabc');
    expect(wiki.downloadPhoto).not.toHaveBeenCalled();
  });

  it('PHOTO-R-004: a Google failure falls back to Wikimedia and is remembered briefly when that has nothing', async () => {
    const c = cache();
    const { r, wiki } = resolver(c, { kind: 'none' }, 'key', { kind: 'failed' });
    expect(await r.resolve(1, 'ChIJabc', 1, 2)).toEqual({ photoUrl: null, attribution: null });
    expect(wiki.downloadPhoto).toHaveBeenCalledWith(1, 2, undefined);
    expect(c.markError).toHaveBeenCalledWith('ChIJabc', 'provider-error');
  });
});
