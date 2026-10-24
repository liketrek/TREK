/**
 * MAPS-038b, MAPS-081b, MAPS-081c: the Nominatim fallback keeps the location bias (#2620).
 *
 * With the TREK Places index off and no key, search and autocomplete fall back to
 * Nominatim, and the point or box the client sent has to reach it as a viewbox.
 * Moved out of maps.service.test.ts as they were, under the describe names they
 * had there.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from '../../helpers/google-quota';
import { buildMapsService } from '../../helpers/maps-service';

import { describe, it, expect, vi, afterEach } from 'vitest';

// Every case below switches the index off. It is stubbed to "nothing found" as
// well, so a case that reached it anyway would not leave the runner for
// places.liketrek.com.
const { mockNearby, mockSearch } = vi.hoisted(() => ({
  mockNearby: vi.fn(async (): Promise<unknown[]> => []),
  mockSearch: vi.fn(async (): Promise<unknown[]> => []),
}));
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesNearby: mockNearby,
  trekPlacesSearch: mockSearch,
}));

// No key is configured, so neither Google nor Amap answers and the query falls
// through to Nominatim.
const noAppSettings = { getValue: async () => null } as unknown as AppSettingsRepository;
const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

const svc = buildMapsService(
  {} as PlacePhotoCacheService,
  noAppSettings,
  noUsers,
  {} as never,
  {} as never,
  noGoogleQuota,
);

/** Switch the TREK Places index off for one case, as maps.service.test.ts does. */
let indexSpy: { mockRestore: () => void } | null = null;
function indexOff(): void {
  indexSpy = vi.spyOn(svc, 'trekPlacesEnabled').mockReturnValue(false);
}

afterEach(() => {
  indexSpy?.mockRestore();
  indexSpy = null;
  vi.unstubAllGlobals();
});

describe('searchPlaces (fetch stubbed)', () => {
  // The same gap on the explicit search: with the index off and no key the
  // fallback asked Nominatim again and dropped the bias it had been given (#2620).
  it('MAPS-038b: the Nominatim fallback keeps the location bias', async () => {
    indexOff();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await svc.searchPlaces(999, 'Starbucks', 'en', { lat: 35, lng: 135.75 });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('viewbox')).toBe('135.25,34.5,136.25,35.5');
    expect(url.searchParams.get('bounded')).toBe('0');
  });
});

describe('autocompletePlaces (fetch stubbed)', () => {
  // Without the index and without a key the suggestions come from Nominatim,
  // and the box the client already computed has to reach it (#2620). It ranks,
  // it does not restrict: bounded=0, so a far away place still comes back.
  it('MAPS-081b: hands the location bias to Nominatim as a viewbox', async () => {
    indexOff();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await svc.autocompletePlaces(999, 'Starbucks', 'en', {
      low: { lat: 34.9, lng: 135.6 },
      high: { lat: 35.1, lng: 135.9 },
    });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toContain('/search');
    expect(url.searchParams.get('bounded')).toBe('0');
    const [west, south, east, north] = String(url.searchParams.get('viewbox')).split(',').map(Number);
    expect((west + east) / 2).toBeCloseTo(135.75);
    expect((south + north) / 2).toBeCloseTo(35);
  });

  it('MAPS-081c: asks Nominatim without a viewbox when no bias was sent', async () => {
    indexOff();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await svc.autocompletePlaces(999, 'Starbucks', 'en');

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.has('viewbox')).toBe(false);
  });
});
