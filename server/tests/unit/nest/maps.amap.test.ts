/**
 * Unit tests for the Amap (高德) places provider and the provider selection it
 * plugs into — AMAP-001 onwards.
 *
 * What these are really about is the two things that make Amap different from
 * Google and that no amount of care at the call site can fix: the datum (GCJ-02
 * in, WGS-84 out, in BOTH directions) and the fact that Amap reports failure in
 * a 200 response body. Everything else is field mapping, which is checked
 * against the shapes Amap actually sends — including `address: []` for a missing
 * string, which is the one that bites.
 *
 * fetch is stubbed; the SSRF guard and the database are mocked, the same way
 * maps.service.test.ts does it.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { gcj02ToWgs84, wgs84ToGcj02 } from '@trek/shared';

const { mockDbGet, mockDbRun, mockInstanceGet, mockProviderGet } = vi.hoisted(() => ({
  mockDbGet: vi.fn((..._args: unknown[]) => undefined as any),
  mockDbRun: vi.fn(),
  mockInstanceGet: vi.fn((..._args: unknown[]) => undefined as any),
  mockProviderGet: vi.fn((..._args: unknown[]) => undefined as any),
}));

vi.mock('../../../src/db/database', () => ({
  db: {
    prepare: (sql: string) => ({
      get: (...args: unknown[]) => {
        if (!sql.includes('app_settings')) return mockDbGet(...args);
        return args[0] === 'places_provider' ? mockProviderGet(...args) : mockInstanceGet(...args);
      },
      all: vi.fn(() => []),
      run: mockDbRun,
    }),
  },
}));

vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {}
  return {
    SsrfBlockedError,
    checkSsrf: vi.fn(async () => ({ allowed: true })),
    safeFetchFollow: vi.fn(async (url: string, init?: any) => (globalThis.fetch as any)(url, init)),
  };
});

vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string | null) => v,
  maybe_encrypt_api_key: (v: string | null) => v,
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

// The index answers search and autocomplete before any keyed provider, and
// trekPlacesEnabled fails open, so a service-level case that reached it with
// the Amap fetch stub in place would leave the runner for places.liketrek.com.
// Stubbed to "nothing found", which is the state that hands the query on.
vi.mock('../../../src/nest/maps/trek-places.client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/maps/trek-places.client')>()),
  trekPlacesSearch: vi.fn(async (): Promise<unknown[]> => []),
}));

import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import {
  AmapPlacesProvider,
  AmapTipStash,
  amapOpeningToOsm,
  amapPoiId,
  isAmapHost,
  isAmapPlaceId,
  parseAmapUrl,
} from '../../../src/nest/maps/providers/amap.provider';
import { isGooglePlaceId } from '../../../src/nest/maps/maps.helpers';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

const photoCacheStub = {
  get: vi.fn(() => null),
  getErrored: vi.fn(() => false),
  put: vi.fn(),
  markError: vi.fn(),
  getInFlight: vi.fn(() => undefined),
  setInFlight: vi.fn(),
  serveKey: vi.fn(() => null),
} as unknown as PlacePhotoCacheService;

const svc = new MapsService(new DatabaseService(db as never), photoCacheStub);

/** A provider over a fixed key, which is all these cases need. */
function provider(tips = new AmapTipStash()): AmapPlacesProvider {
  return new AmapPlacesProvider({ key: 'amap-test-key', source: 'instance', userId: 3 }, tips);
}

/** Amap's success envelope. */
function ok(body: Record<string, unknown>) {
  return { ok: true, status: 200, json: async () => ({ status: '1', info: 'OK', infocode: '10000', ...body }) };
}

/** Amap's failure envelope — note the HTTP 200. */
function amapError(infocode: string, info = 'SOMETHING_WRONG') {
  return { ok: true, status: 200, json: async () => ({ status: '0', info, infocode }) };
}

/** The URL the single stubbed call was made with. */
function calledUrl(): string {
  return String((globalThis.fetch as any).mock.calls[0][0]);
}

/** One POI in Beijing, at a GCJ-02 coordinate. */
const TIANANMEN_GCJ = wgs84ToGcj02(39.90869, 116.39124);
const TIANANMEN_LOCATION = `${TIANANMEN_GCJ.lng.toFixed(6)},${TIANANMEN_GCJ.lat.toFixed(6)}`;

afterEach(() => {
  vi.unstubAllGlobals();
  mockDbGet.mockReset();
  mockDbGet.mockReturnValue(undefined);
  mockDbRun.mockReset();
  mockInstanceGet.mockReset();
  mockInstanceGet.mockReturnValue(undefined);
  mockProviderGet.mockReset();
  mockProviderGet.mockReturnValue(undefined);
});

// ── Place id namespace ───────────────────────────────────────────────────────

describe('Amap place ids', () => {
  it('AMAP-001: namespaces an Amap id so it can never be sent to Google', () => {
    expect(isAmapPlaceId('amap:B000A83M61')).toBe(true);
    expect(amapPoiId('amap:B000A83M61')).toBe('B000A83M61');
    // The whole point: Google's own id check must reject it, because Google
    // answers a foreign id with a BILLABLE 400 INVALID_ARGUMENT.
    expect(isGooglePlaceId('amap:B000A83M61')).toBe(false);
    // And a bare Amap id, which is what we would have had without the prefix,
    // is indistinguishable from a Google one — hence the prefix.
    expect(isGooglePlaceId('B000A83M61')).toBe(true);
  });

  it('AMAP-002: is not confused with an OSM id or a coordinate pseudo-id', () => {
    expect(isAmapPlaceId('node:240109189')).toBe(false);
    expect(isAmapPlaceId('coords:39.9,116.4')).toBe(false);
    expect(isAmapPlaceId('ChIJ_____')).toBe(false);
  });
});

// ── searchText ───────────────────────────────────────────────────────────────

describe('AmapPlacesProvider.searchText', () => {
  it('AMAP-010: converts the returned GCJ-02 coordinate back to WGS-84', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          pois: [
            {
              id: 'B000A83M61',
              name: '天安门',
              address: '东长安街',
              location: TIANANMEN_LOCATION,
              pname: '北京市',
              cityname: '北京市',
              adname: '东城区',
              type: '风景名胜;风景名胜相关;旅游景点',
            },
          ],
        }),
      ),
    );

    const [place] = await provider().searchText('天安门');

    // Back within a metre of where it started, i.e. the datum round-tripped.
    expect(place.lat as number).toBeCloseTo(39.90869, 4);
    expect(place.lng as number).toBeCloseTo(116.39124, 4);
    expect(place.amap_poi_id).toBe('amap:B000A83M61');
    expect(place.source).toBe('amap');
    expect(place.types).toEqual(['风景名胜', '风景名胜相关', '旅游景点']);
  });

  it('AMAP-011: assembles a full address without repeating a municipality', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          pois: [
            {
              id: 'B1',
              name: '故宫',
              address: '景山前街4号',
              location: TIANANMEN_LOCATION,
              pname: '北京市',
              cityname: '北京市',
              adname: '东城区',
            },
          ],
        }),
      ),
    );
    const [place] = await provider().searchText('故宫');
    expect(place.address).toBe('北京市东城区景山前街4号');
  });

  it('AMAP-012: survives the empty arrays Amap sends for absent string fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          pois: [
            {
              id: 'B2',
              name: '某小店',
              // These are what Amap really returns when the field has no value —
              // not undefined, and not '': an empty ARRAY.
              address: [],
              tel: [],
              website: [],
              location: TIANANMEN_LOCATION,
              pname: [],
              cityname: [],
              adname: [],
            },
          ],
        }),
      ),
    );
    const [place] = await provider().searchText('某小店');
    // Not "[]" and not "[object Object]" — the failure this coercion prevents.
    expect(place.address).toBe('');
    expect(place.phone).toBeNull();
    expect(place.website).toBeNull();
  });

  // #2483: a site in Amap is free text, and often a bare host.
  it('AMAP-012b: a website without a scheme gains https, one that is no website becomes null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          pois: [
            { id: 'B3', name: '故宫博物院', website: 'www.dpm.org.cn', location: TIANANMEN_LOCATION },
            { id: 'B4', name: '某小店', website: 'javascript:alert(1)', location: TIANANMEN_LOCATION },
          ],
        }),
      ),
    );
    const places = await provider().searchText('故宫');
    expect(places.map((p) => p.website)).toEqual(['https://www.dpm.org.cn', null]);
  });

  it('AMAP-013: uses place/around with a bias, because text search cannot be biased', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [] })));
    await provider().searchText('咖啡', 'zh', { lat: 31.2304, lng: 121.4737, radius: 3000 });

    const url = calledUrl();
    expect(url).toContain('/v3/place/around');
    expect(url).toContain('radius=3000');
    // The outbound coordinate is GCJ-02, i.e. NOT the WGS-84 value we passed in.
    const location = new URL(url).searchParams.get('location')!;
    const [lng, lat] = location.split(',').map(Number);
    const back = gcj02ToWgs84(lat, lng);
    expect(back.lat).toBeCloseTo(31.2304, 4);
    expect(back.lng).toBeCloseTo(121.4737, 4);
    expect(lat).not.toBeCloseTo(31.2304, 4);
  });

  it('AMAP-014: clamps the radius to the 50 km Amap accepts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [] })));
    await provider().searchText('x', undefined, { lat: 31.2304, lng: 121.4737, radius: 900000 });
    expect(calledUrl()).toContain('radius=50000');
  });

  it('AMAP-015: uses place/text without a bias', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [] })));
    await provider().searchText('外滩');
    expect(calledUrl()).toContain('/v3/place/text');
  });

  it('AMAP-015b: a pois field that is not a list answers empty instead of throwing a 500', async () => {
    // `as T` only ever described what the answer was meant to look like. The
    // base URL is configurable, and an object here used to reach `.map` and
    // throw a TypeError nobody caught between the provider and the controller.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: { id: 'B3' } })));
    await expect(provider().searchText('外滩')).resolves.toEqual([]);
  });

  it('AMAP-015c: a body larger than the cap is refused before it is read', async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (n: string) => (n === 'content-length' ? String(50 * 1024 * 1024) : null) },
      body: { getReader: () => ({ read: async () => ({ done: true }), cancel }), cancel },
      json: async () => ({ status: '1', pois: [] }),
    }));

    await expect(provider().searchText('外滩')).rejects.toThrow(/more than/);
    // The socket goes back rather than staying pinned on a body nobody reads.
    expect(cancel).toHaveBeenCalled();
  });

  it('AMAP-016: keeps a POI that has no geometry rather than dropping it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [{ id: 'B3', name: '无坐标', location: [] }] })));
    const [place] = await provider().searchText('无坐标');
    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
    expect(place.name).toBe('无坐标');
  });

  it('AMAP-017: an empty place/around falls through to place/text, which can read a region out of the keywords', async () => {
    // The client's details-miss fallback searches for "name, region". around
    // matches that literally against POI names and finds nothing; text parses
    // the region and answers. Invented fixtures: the id and the place do not
    // exist.
    const villageGcj = wgs84ToGcj02(30.0, 120.0);
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(ok({ pois: [] }))
      .mockResolvedValueOnce(
        ok({ pois: [{ id: 'B0TESTVIL1', name: 'Test Village', location: `${villageGcj.lng},${villageGcj.lat}` }] }),
      );
    vi.stubGlobal('fetch', fetchSpy);

    const places = await provider().searchText('Test Village, Test Region', 'zh', { lat: 30.0, lng: 120.0, radius: 5000 });

    expect(places).toHaveLength(1);
    expect(places[0].amap_poi_id).toBe('amap:B0TESTVIL1');
    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calls[0]).toContain('/v3/place/around');
    expect(calls[1]).toContain('/v3/place/text');
  });

  it('AMAP-017b: a place/around with hits answers alone, place/text is not asked', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(ok({ pois: [{ id: 'B1', name: '咖啡', location: TIANANMEN_LOCATION }] }));
    vi.stubGlobal('fetch', fetchSpy);

    const places = await provider().searchText('咖啡', 'zh', { lat: 39.9, lng: 116.4, radius: 3000 });

    expect(places).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(calledUrl()).toContain('/v3/place/around');
  });
});

// ── Error translation ────────────────────────────────────────────────────────

describe('Amap error handling', () => {
  it('AMAP-020: turns an invalid-key body into a 403, despite the HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(amapError('10001', 'INVALID_USER_KEY')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(provider().searchText('x')).rejects.toMatchObject({ status: 403 });
    // The hint has to name what an admin can change; Amap's own wording does not.
    await expect(provider().searchText('x')).rejects.toThrow(/Web 服务/);
    errorSpy.mockRestore();
  });

  it('AMAP-021: turns quota exhaustion into a 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(amapError('10003')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(provider().searchText('x')).rejects.toMatchObject({ status: 429 });
    errorSpy.mockRestore();
  });

  it('AMAP-022: reports the key source and the user, never the key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(amapError('10009')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(provider().searchText('x')).rejects.toMatchObject({ status: 403 });
    const logged = errorSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('keySource=instance');
    expect(logged).toContain('userId=3');
    expect(logged).not.toContain('amap-test-key');
    errorSpy.mockRestore();
  });

  it('AMAP-023: an unknown infocode is a 502 and keeps Amap\u2019s own wording', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(amapError('20800', 'OUT_OF_SERVICE')));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(provider().searchText('x')).rejects.toMatchObject({ status: 502, message: /OUT_OF_SERVICE/ });
    errorSpy.mockRestore();
  });
});

// ── autocomplete ─────────────────────────────────────────────────────────────

describe('AmapPlacesProvider.autocomplete', () => {
  it('AMAP-030: namespaces every suggestion id and caps the list at five', async () => {
    const tips = Array.from({ length: 8 }, (_, i) => ({
      id: `T${i}`,
      name: `候选${i}`,
      district: '北京市东城区',
      address: '某路',
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ tips })));

    const suggestions = await provider().autocomplete('候选');
    expect(suggestions).toHaveLength(5);
    expect(suggestions[0].placeId).toBe('amap:T0');
    expect(suggestions[0].mainText).toBe('候选0');
    expect(suggestions[0].secondaryText).toBe('北京市东城区 某路');
    expect(calledUrl()).toContain('/v3/assistant/inputtips');
  });

  it('AMAP-031: drops a tip with no id, which cannot be looked up afterwards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(ok({ tips: [{ name: '一条路', id: [] }, { id: 'T9', name: '有效的' }] })),
    );
    const suggestions = await provider().autocomplete('路');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].placeId).toBe('amap:T9');
  });

  it('AMAP-032: biases around the centre of the viewport, in GCJ-02', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ tips: [] })));
    await provider().autocomplete('咖啡', 'zh', {
      low: { lat: 31.2, lng: 121.4 },
      high: { lat: 31.3, lng: 121.5 },
    });
    const location = new URL(calledUrl()).searchParams.get('location')!;
    const [lng, lat] = location.split(',').map(Number);
    const back = gcj02ToWgs84(lat, lng);
    expect(back.lat).toBeCloseTo(31.25, 3);
    expect(back.lng).toBeCloseTo(121.45, 3);
  });
});

// ── placeDetails ─────────────────────────────────────────────────────────────

describe('AmapPlacesProvider.placeDetails', () => {
  it('AMAP-040: looks up the bare poi id via v5 and returns WGS-84', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          pois: [
            {
              id: 'B000A83M61',
              name: '天安门',
              address: '东长安街',
              location: TIANANMEN_LOCATION,
              business: { rating: '4.8', tel: '010-12345678' },
            },
          ],
        }),
      ),
    );

    const place = await provider().placeDetails('amap:B000A83M61');
    const url = calledUrl();
    expect(url).toContain('/v5/place/detail');
    // The prefix is ours, not Amap's — it must not reach the API.
    expect(new URL(url).searchParams.get('id')).toBe('B000A83M61');
    expect(place!.rating).toBe(4.8);
    expect(place!.phone).toBe('010-12345678');
    expect(place!.lat as number).toBeCloseTo(39.90869, 4);
  });

  it('AMAP-041: returns null for an id that is not an Amap id, without calling out', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await provider().placeDetails('ChIJsomething')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('AMAP-042: returns null when Amap knows the id but has no POI for it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [] })));
    expect(await provider().placeDetails('amap:B000A83M61')).toBeNull();
  });

  it('AMAP-043: answers from the tip autocomplete served when the detail index does not know the id', async () => {
    // inputtips indexes 地名地址 entries (typecode 19xxxx: villages, lanes)
    // that place/detail then answers with count=0. Without the stash the pick
    // ends in a failed search. Invented fixtures throughout.
    const villageGcj = wgs84ToGcj02(30.0, 120.0);
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        ok({
          tips: [
            {
              id: 'B0TESTVIL2',
              name: 'Test Village',
              district: 'Test Province Test City',
              address: 'Test Hamlet',
              location: `${villageGcj.lng},${villageGcj.lat}`,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(ok({ count: '0', pois: [] }));
    vi.stubGlobal('fetch', fetchSpy);

    // Two provider instances, as two requests make them, sharing one stash.
    const tips = new AmapTipStash();
    const [suggestion] = await provider(tips).autocomplete('Test Vil');
    expect(suggestion.placeId).toBe('amap:B0TESTVIL2');

    const place = await provider(tips).placeDetails('amap:B0TESTVIL2');
    expect(place).not.toBeNull();
    expect(place!.name).toBe('Test Village');
    expect(place!.address).toBe('Test Province Test CityTest Hamlet');
    // The tip's GCJ-02 coordinate made it back to WGS-84.
    expect(place!.lat as number).toBeCloseTo(30.0, 4);
    expect(place!.lng as number).toBeCloseTo(120.0, 4);
    expect(place!.source).toBe('amap');
    expect(place!.cached_at).toBeTypeOf('number');
    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calls[1]).toContain('/v5/place/detail');
  });

  it('AMAP-044: without a stashed tip the empty detail answer is still null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ count: '0', pois: [] })));
    expect(await provider().placeDetails('amap:B0TESTNONE')).toBeNull();
  });

  it('AMAP-045: Chinese hours from v5 place/detail become weekday lines and periods', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [{
      id: 'B0TESTHRS1', name: 'Test Shop', location: TIANANMEN_LOCATION,
      business: { opentime_week: '周一至周五 09:00-18:00；周六、周日 10:00-16:00' },
    }] })));

    const place = await provider().placeDetails('amap:B0TESTHRS1');

    expect(place!.opening_hours).toEqual([
      'Monday: 09:00-18:00', 'Tuesday: 09:00-18:00', 'Wednesday: 09:00-18:00', 'Thursday: 09:00-18:00',
      'Friday: 09:00-18:00', 'Saturday: 10:00-16:00', 'Sunday: 10:00-16:00',
    ]);
    expect(place!.opening_periods).toHaveLength(7);
  });

  it('AMAP-046: a dated holiday segment is dropped, not allowed to void the week', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [{
      id: 'B0TESTHRS2', name: 'Test Shop', location: TIANANMEN_LOCATION,
      business: { opentime_week: '周一至周五 09:00-18:00；2026-10-01至2026-10-07 10:00-22:00' },
    }] })));

    const place = await provider().placeDetails('amap:B0TESTHRS2');

    expect(place!.opening_periods).toHaveLength(5);
    expect((place!.opening_hours as string[])[5]).toBe('Saturday: ?');
  });

  it('AMAP-047: hours the translation cannot fully read give no hours, not a verbatim line', async () => {
    // Amap's own documented example: a service remark with a nested ；, and a
    // Saturday segment that is prose. Partly parsed, Saturday would read as closed.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ pois: [{
      id: 'B0TESTHRS3', name: 'Test Bank', location: TIANANMEN_LOCATION,
      business: { opentime_week: '周一至周五:08:30-17:30(延时服务时间:08:30-09:00；12:00-13:30)；周六延时服务时间:09:00-13:00(法定节假日除外)' },
    }] })));

    const place = await provider().placeDetails('amap:B0TESTHRS3');

    expect(place!.opening_hours).toBeNull();
    expect(place!.opening_periods).toBeNull();
    expect(place!.open_now).toBeNull();
  });

  it('AMAP-048: amapOpeningToOsm reads the common spellings and refuses a partial read', () => {
    const rows: [string, string | null][] = [
      ['周一至周日 10:00-22:00', 'Mo-Su 10:00-22:00'],
      ['周一至周四,周日 09:30-22:00；周五至周六 09:30-22:30', 'Mo-Th,Su 09:30-22:00; Fr-Sa 09:30-22:30'],
      ['周一至周五 09:00-18:00；周六、周日 10:00-16:00', 'Mo-Fr 09:00-18:00; Sa,Su 10:00-16:00'],
      ['周一至周五 10:00-14:00，周六至周日 17:00-22:00', 'Mo-Fr 10:00-14:00; Sa-Su 17:00-22:00'],
      ['每天 10:00～22:00', 'Mo-Su 10:00-22:00'],
      ['周一至周日:10：00-22：00', 'Mo-Su 10:00-22:00'],
      ['星期一到星期五 09:00-12:00 14:00-18:00', 'Mo-Fr 09:00-12:00,14:00-18:00'],
      ['周一至周日 18:00-次日02:00', 'Mo-Su 18:00-02:00'],
      ['24小时营业', 'Mo-Su 00:00-24:00'],
      ['周二至周日 09:00-17:00(周一闭馆)', 'Tu-Su 09:00-17:00'],
      ['周二至周日 09:00-17:00；周一闭馆', 'Tu-Su 09:00-17:00'],
      ['周一至周五 09:00-18:00；法定节假日 10:00-16:00', null],
      ['Open daily 10:00-22:00', null],
      ['2026-10-01至2026-10-07 10:00-22:00', null],
    ];
    for (const [input, expected] of rows) expect(amapOpeningToOsm(input), input).toBe(expected);
  });

  it('AMAP-049: a stashed tip without a coordinate is still null, so the client falls back to its text search', async () => {
    const tips = new AmapTipStash();
    tips.remember([{ id: 'B0TESTVIL3', name: 'Test Village', location: [] }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ count: '0', pois: [] })));

    expect(await provider(tips).placeDetails('amap:B0TESTVIL3')).toBeNull();
  });
});

// ── reverse ──────────────────────────────────────────────────────────────────

describe('AmapPlacesProvider.reverse', () => {
  it('AMAP-050: sends GCJ-02 and prefers the AOI the click landed inside', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          regeocode: {
            formatted_address: '北京市东城区天安门广场',
            aois: [{ name: '天安门广场' }],
            pois: [{ name: '国旗杆' }],
            addressComponent: { building: { name: '某楼' } },
          },
        }),
      ),
    );

    const answer = await provider().reverse(39.90869, 116.39124);
    expect(answer).toEqual({ name: '天安门广场', address: '北京市东城区天安门广场' });
    const location = new URL(calledUrl()).searchParams.get('location')!;
    const [lng, lat] = location.split(',').map(Number);
    expect(gcj02ToWgs84(lat, lng).lat).toBeCloseTo(39.90869, 4);
  });

  it('AMAP-051: falls through the name candidates when there is no AOI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({ regeocode: { formatted_address: '某地址', aois: [], pois: [], addressComponent: { neighborhood: { name: '某社区' } } } }),
      ),
    );
    expect((await provider().reverse(39.9, 116.4))!.name).toBe('某社区');
  });
});

// ── Shared-link parsing ──────────────────────────────────────────────────────

describe('parseAmapUrl', () => {
  it('AMAP-060: reads uri.amap.com marker links as lng,lat in GCJ-02', () => {
    const parsed = parseAmapUrl(`https://uri.amap.com/marker?position=${TIANANMEN_LOCATION}&name=%E5%A4%A9%E5%AE%89%E9%97%A8`);
    expect(parsed).not.toBeNull();
    // Longitude first AND a datum shift: reading this link the Google way would
    // put a Beijing landmark in the Indian Ocean.
    expect(parsed!.lat).toBeCloseTo(39.90869, 4);
    expect(parsed!.lng).toBeCloseTo(116.39124, 4);
    expect(parsed!.name).toBe('天安门');
  });

  it('AMAP-061: picks the poi id out of a place page', () => {
    const parsed = parseAmapUrl('https://www.amap.com/place/B000A83M61');
    expect(parsed!.poiId).toBe('B000A83M61');
    expect(Number.isNaN(parsed!.lat)).toBe(true);
  });

  it('AMAP-062: refuses a host that is not Amap', () => {
    expect(parseAmapUrl('https://amap.com.evil.example/marker?position=116,39')).toBeNull();
    expect(parseAmapUrl('not a url')).toBeNull();
  });

  it('AMAP-063: recognises only Amap\u2019s own hosts', () => {
    expect(isAmapHost('uri.amap.com')).toBe(true);
    expect(isAmapHost('www.amap.com')).toBe(true);
    expect(isAmapHost('surl.amap.com')).toBe(true);
    expect(isAmapHost('amap.com.attacker.net')).toBe(false);
    expect(isAmapHost('notamap.com')).toBe(false);
  });
});

// ── Provider selection ───────────────────────────────────────────────────────

/** The user row resolveApiKey reads, with both key columns on it. */
type KeyRow = { maps_api_key: string | null; amap_api_key: string | null };

/** Make the Google key chain answer, the Amap chain answer, or neither. */
function keys(opts: { google?: string; amap?: string }) {
  mockDbGet.mockImplementation((..._args: unknown[]): KeyRow => {
    // resolveApiKey reads the caller's own row per name; the SQL differs but
    // the stub only sees the bound userId, so answer both columns at once.
    return { maps_api_key: opts.google ?? null, amap_api_key: opts.amap ?? null };
  });
}

describe('MapsService.keyedProvider', () => {
  it('AMAP-070: auto keeps Google when a Google key is configured', () => {
    keys({ google: 'gkey', amap: 'akey' });
    expect(svc.keyedProvider(1)).toMatchObject({ id: 'google', key: 'gkey', source: 'user-row' });
    expect(svc.resolvePlacesProvider(1)).toBeNull();
  });

  it('AMAP-071: auto falls to Amap only when there is no Google key', () => {
    keys({ amap: 'akey' });
    expect(svc.keyedProvider(1)?.id).toBe('amap');
    expect(svc.resolvePlacesProvider(1)).toBeInstanceOf(AmapPlacesProvider);
  });

  it('AMAP-072: auto with no key at all means the OpenStreetMap stack', () => {
    keys({});
    expect(svc.keyedProvider(1)).toBeNull();
    expect(svc.resolvePlacesProvider(1)).toBeNull();
  });

  it('AMAP-073: an explicit amap choice wins over a configured Google key', () => {
    mockProviderGet.mockReturnValue({ value: 'amap' });
    keys({ google: 'gkey', amap: 'akey' });
    expect(svc.resolvePlacesProvider(1)).toBeInstanceOf(AmapPlacesProvider);
  });

  it('AMAP-074: an explicit google choice never silently uses Amap instead', () => {
    mockProviderGet.mockReturnValue({ value: 'google' });
    keys({ amap: 'akey' });
    // Misconfigured means "answer with OSM", not "bill somebody else's provider".
    expect(svc.keyedProvider(1)).toBeNull();
  });

  it('AMAP-075: openstreetmap ignores both keys', () => {
    mockProviderGet.mockReturnValue({ value: 'openstreetmap' });
    keys({ google: 'gkey', amap: 'akey' });
    expect(svc.keyedProvider(1)).toBeNull();
  });

  it('AMAP-076: a hand-edited nonsense value degrades to auto instead of failing', () => {
    mockProviderGet.mockReturnValue({ value: 'not-a-provider' });
    keys({ google: 'gkey' });
    expect(svc.placesProviderChoice()).toBe('auto');
    expect(svc.keyedProvider(1)?.id).toBe('google');
  });

  it('AMAP-077: an Amap place stays with Amap even while Google is selected', async () => {
    mockProviderGet.mockReturnValue({ value: 'google' });
    keys({ google: 'gkey', amap: 'akey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(ok({ pois: [{ id: 'B9', name: '旧地点', location: TIANANMEN_LOCATION }] })),
    );

    const { place } = await svc.getPlaceDetails(1, 'amap:B9');
    // Reached Amap's endpoint, not Google's — an id outlives the setting.
    expect(calledUrl()).toContain('restapi.amap.com');
    expect(place!.name).toBe('旧地点');
  });

  it('AMAP-077b: a Google place still opens after the admin switches to Amap', async () => {
    // The mirror of AMAP-077, and the one that matters on a real migration: an
    // install with a year of google_place_id rows switches provider, and every
    // one of those places has to keep opening against the Google key that is
    // still configured.
    mockProviderGet.mockReturnValue({ value: 'amap' });
    keys({ google: 'gkey', amap: 'akey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'ChIJ123', displayName: { text: 'Old Google place' }, location: { latitude: 48.8, longitude: 2.3 } }),
      }),
    );

    const { place } = await svc.getPlaceDetails(1, 'ChIJ123');
    expect(calledUrl()).toContain('places.googleapis.com');
    expect(place!.name).toBe('Old Google place');
  });

  it('AMAP-078: an Amap id is never mistaken for an OSM type:id pair', async () => {
    // `amap:B9` contains a colon, like `node:123`. Read as OSM it would go to
    // Overpass as element type "amap" and answer every Chinese place with a
    // blank record — so the ordering of those two branches is load-bearing.
    mockProviderGet.mockReturnValue({ value: 'amap' });
    keys({ amap: 'akey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(ok({ pois: [{ id: 'B9', name: '天安门', location: TIANANMEN_LOCATION }] })),
    );
    const { place } = await svc.getPlaceDetails(1, 'amap:B9');
    expect(place!.source).toBe('amap');
    expect(calledUrl()).not.toContain('overpass');
  });

  // #2483: a details row cached before the fix holds Amap's website as it came,
  // often a bare host, and keeps for a week.
  it('AMAP-079: a cached details row with a bare website is served with https', async () => {
    mockProviderGet.mockReturnValue({ value: 'amap' });
    const row = { payload_json: JSON.stringify({ name: '旧酒店', website: 'www.hotel.cn', source: 'amap' }), fetched_at: Date.now() };
    // The cache lookup binds the place id, the key lookup the user id.
    mockDbGet.mockImplementation((...args: unknown[]) =>
      args[0] === 'amap:B7' ? row : { maps_api_key: null, amap_api_key: 'akey' },
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { place } = await svc.getPlaceDetails(1, 'amap:B7');
    expect(place).toMatchObject({ name: '旧酒店', website: 'https://www.hotel.cn' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('MapsService with Amap in the keyed slot', () => {
  // The index and OpenStreetMap are asked first either way; these cases are
  // about what answers once they have nothing, so the index is switched off
  // the way maps.service.test.ts does it for the Google cases.
  let indexSpy: { mockRestore: () => void } | null = null;
  afterEach(() => {
    indexSpy?.mockRestore();
    indexSpy = null;
  });
  function amapSelected() {
    indexSpy = vi.spyOn(svc, 'trekPlacesEnabled').mockReturnValue(false);
    mockProviderGet.mockReturnValue({ value: 'amap' });
    keys({ amap: 'akey' });
  }

  it('AMAP-080: search reports amap as the source so the client can credit it', async () => {
    amapSelected();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(ok({ pois: [{ id: 'B1', name: '外滩', location: TIANANMEN_LOCATION }] })),
    );

    const result = await svc.searchPlaces(1, '外滩');
    expect(result.source).toBe('amap');
    expect(result.places).toHaveLength(1);
    expect(result.places[0].amap_poi_id).toBe('amap:B1');
  });

  it('AMAP-085: the tip a suggestion came from answers the details request that follows it', async () => {
    // Two requests, two provider instances: the stash has to live on the service.
    amapSelected();
    const villageGcj = wgs84ToGcj02(30.0, 120.0);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: unknown) =>
        String(url).includes('/v3/assistant/inputtips')
          ? ok({ tips: [{ id: 'B0TESTVIL4', name: 'Test Village', district: 'Test District', location: `${villageGcj.lng},${villageGcj.lat}` }] })
          : ok({ count: '0', pois: [] }),
      ),
    );

    await svc.autocompletePlaces(1, 'Test Vil');
    const { place } = await svc.getPlaceDetails(1, 'amap:B0TESTVIL4');

    expect(place!.name).toBe('Test Village');
    expect(place!.lat as number).toBeCloseTo(30.0, 4);
  });

  it('AMAP-081: autocomplete goes to inputtips instead of Nominatim', async () => {
    amapSelected();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ tips: [{ id: 'T1', name: '外滩', district: '上海市黄浦区' }] })));

    const result = await svc.autocompletePlaces(1, '外滩');
    expect(result.source).toBe('amap');
    expect(result.suggestions[0].placeId).toBe('amap:T1');
    expect(calledUrl()).toContain('/v3/assistant/inputtips');
  });

  it('AMAP-082: reverse geocoding asks Amap at the instance key, and falls back to Nominatim when it fails', async () => {
    // No user behind a reverse lookup: the chain stops at the instance-wide row.
    mockProviderGet.mockReturnValue({ value: 'amap' });
    mockInstanceGet.mockReturnValue({ value: 'akey' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(amapError('10003'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: '某处', display_name: '某地址' }) });
    vi.stubGlobal('fetch', fetchSpy);

    const answer = await svc.reverseGeocode('39.9', '116.4');
    expect(answer).toEqual({ name: '某处', address: '某地址' });
    const calls = fetchSpy.mock.calls.map(call => String(call[0]));
    expect(calls[0]).toContain('/v3/geocode/regeo');
    expect(calls[1]).toContain('nominatim');
    errorSpy.mockRestore();
  });

  it('AMAP-082b: a point outside the Amap box goes straight to Nominatim', async () => {
    // Lisbon. Amap holds the slot, but it knows nothing out here, so asking it
    // buys a round trip and an empty answer before the fallback runs anyway.
    mockProviderGet.mockReturnValue({ value: 'amap' });
    mockInstanceGet.mockReturnValue({ value: 'akey' });
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: 'Belém', display_name: 'Lisboa' }) });
    vi.stubGlobal('fetch', fetchSpy);

    const answer = await svc.reverseGeocode('38.6916', '-9.2160');

    expect(answer).toEqual({ name: 'Belém', address: 'Lisboa' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain('nominatim');
  });

  it('AMAP-083: a pasted Amap marker link resolves without touching the Google path', async () => {
    // Auto with no key at all: the address comes from Nominatim, the coordinate
    // and the name from the link itself, already converted to WGS-84.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ display_name: '北京市东城区' }) }));

    const result = await svc.resolveGoogleMapsUrl(
      `https://uri.amap.com/marker?position=${TIANANMEN_LOCATION}&name=%E5%A4%A9%E5%AE%89%E9%97%A8`,
    );
    expect(result.lat).toBeCloseTo(39.90869, 4);
    expect(result.lng).toBeCloseTo(116.39124, 4);
    expect(result.name).toBe('天安门');
    expect(result.address).toBe('北京市东城区');
    expect(result.google_ftid).toBeNull();
    expect(calledUrl()).toContain('nominatim');
  });

  it('AMAP-084: an Amap POI page with no coordinate is the same 400 a bare Google page gets', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(svc.resolveGoogleMapsUrl('https://www.amap.com/place/B000A83M61')).rejects.toMatchObject({ status: 400 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('AmapTipStash', () => {
  it('AMAP-090: a tip is forgotten once its ten minutes are up', () => {
    const tips = new AmapTipStash();
    tips.remember([{ id: 'T1', name: 'x' }], 1_000);
    expect(tips.recall('T1', 1_000 + AmapTipStash.TTL_MS - 1)?.name).toBe('x');
    expect(tips.recall('T1', 1_000 + AmapTipStash.TTL_MS)).toBeNull();
    // Dropped on the expired read, not merely hidden.
    expect(tips.recall('T1', 0)).toBeNull();
    expect(tips.recall('nope')).toBeNull();
  });

  it('AMAP-091: holds at most 500 tips, oldest out first, and a tip served again counts as new', () => {
    const tips = new AmapTipStash();
    tips.remember(Array.from({ length: AmapTipStash.MAX }, (_, i) => ({ id: `T${i}` })), 0);
    tips.remember([{ id: 'T0' }], 0);
    tips.remember([{ id: 'NEW' }], 0);
    expect(tips.recall('T0', 0)).not.toBeNull();
    expect(tips.recall('T1', 0)).toBeNull();
    expect(tips.recall('NEW', 0)).not.toBeNull();
  });
});
