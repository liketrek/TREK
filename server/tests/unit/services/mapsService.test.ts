/**
 * Unit tests for mapsService — MAPS-001 through MAPS-080.
 * Covers parseOpeningHours, buildOsmDetails, getMapsKey, reverseGeocode,
 * resolveGoogleMapsUrl (coordinate extraction + short URL / SSRF),
 * searchNominatim, fetchOverpassDetails, fetchWikimediaPhoto, searchPlaces,
 * getPlaceDetails, and getPlacePhoto (all branches including cache logic).
 * fetch is stubbed; DB and ssrfGuard are mocked.
 */
import {
  parseOpeningHours,
  buildOsmDetails,
  getMapsKey,
  googleFtidFromMapsUrl,
  buildUserAgent,
  resolveOverpassEndpoints,
  resolveOverpassTimeoutMs,
  searchOverpassPois,
} from '../../../src/services/mapsService';

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

const {
  mockDbGet,
  mockDbRun,
  mockCheckSsrf,
  mockCacheGet,
  mockCacheGetErrored,
  mockCachePut,
  mockCacheGetInFlight,
  mockCacheSetInFlight,
} = vi.hoisted(() => ({
  mockDbGet: vi.fn(() => undefined as any),
  mockDbRun: vi.fn(),
  mockCheckSsrf: vi.fn(async () => ({ allowed: true })),
  mockCacheGet: vi.fn(() => null as any),
  mockCacheGetErrored: vi.fn(() => false),
  mockCachePut: vi.fn(async (placeId: string, _bytes: Buffer, attribution: string | null) => ({
    photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`,
    filePath: `/tmp/${placeId}.jpg`,
    attribution,
  })),
  mockCacheGetInFlight: vi.fn(() => undefined),
  mockCacheSetInFlight: vi.fn(),
}));

vi.mock('../../../src/db/database', () => ({
  db: {
    prepare: () => ({ get: mockDbGet, all: vi.fn(() => []), run: mockDbRun }),
  },
}));

vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  }
  return {
    checkSsrf: mockCheckSsrf,
    SsrfBlockedError,
    // Mirror the real per-hop helper closely enough for unit tests: run the
    // (mocked) SSRF check, then fetch through the (stubbed) global fetch. The
    // fetch stubs in these tests already return the final resolved response.
    safeFetchFollow: vi.fn(async (url: string, init?: any) => {
      const ssrf = await mockCheckSsrf(url);
      if (!ssrf.allowed) throw new SsrfBlockedError(ssrf.error ?? 'Request blocked by SSRF guard');
      return (globalThis.fetch as any)(url, init);
    }),
  };
});

vi.mock('../../../src/services/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string | null) => v,
}));

vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: '0'.repeat(64),
}));

vi.mock('../../../src/services/placePhotoCache', () => ({
  get: (placeId: string) => mockCacheGet(placeId),
  getErrored: (placeId: string) => mockCacheGetErrored(placeId),
  put: (placeId: string, bytes: Buffer, attribution: string | null) => mockCachePut(placeId, bytes, attribution),
  markError: vi.fn(),
  getInFlight: (placeId: string) => mockCacheGetInFlight(placeId),
  setInFlight: (placeId: string, p: Promise<any>) => mockCacheSetInFlight(placeId, p),
  serveFilePath: vi.fn(() => null),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockDbGet.mockReset();
  mockDbGet.mockReturnValue(undefined);
  mockDbRun.mockReset();
  mockCheckSsrf.mockReset();
  mockCheckSsrf.mockResolvedValue({ allowed: true });
  mockCacheGet.mockReset();
  mockCacheGet.mockReturnValue(null);
  mockCacheGetErrored.mockReset();
  mockCacheGetErrored.mockReturnValue(false);
  mockCachePut.mockReset();
  mockCachePut.mockImplementation(async (placeId: string, _bytes: Buffer, attribution: string | null) => ({
    photoUrl: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`,
    filePath: `/tmp/${placeId}.jpg`,
    attribution,
  }));
  mockCacheGetInFlight.mockReset();
  mockCacheGetInFlight.mockReturnValue(undefined);
  mockCacheSetInFlight.mockReset();
});

// ── parseOpeningHours ─────────────────────────────────────────────────────────

describe('parseOpeningHours', () => {
  it('MAPS-001: returns 7 weekday descriptions and openNow', () => {
    const result = parseOpeningHours('Mo-Fr 09:00-18:00');
    expect(result.weekdayDescriptions).toHaveLength(7);
    expect(result.weekdayDescriptions[0]).toContain('Monday: 09:00-18:00');
    expect(typeof result.openNow === 'boolean' || result.openNow === null).toBe(true);
  });

  it('MAPS-002: marks unknown days with ?', () => {
    const result = parseOpeningHours('Mo 10:00-12:00');
    expect(result.weekdayDescriptions[1]).toContain('?');
  });

  it('MAPS-003: handles multiple segments separated by semicolons', () => {
    const result = parseOpeningHours('Mo-Fr 09:00-18:00; Sa 10:00-14:00');
    expect(result.weekdayDescriptions[5]).toContain('Saturday: 10:00-14:00');
    expect(result.weekdayDescriptions[0]).toContain('Monday: 09:00-18:00');
  });

  it('MAPS-004: handles 24/7 string gracefully (no crash)', () => {
    const result = parseOpeningHours('24/7');
    expect(result.weekdayDescriptions).toHaveLength(7);
  });

  it('MAPS-005: returns openNow null for unparseable format', () => {
    const result = parseOpeningHours('invalid-hours-string');
    expect(result.openNow).toBeNull();
  });

  it('MAPS-006: handles comma-separated days', () => {
    const result = parseOpeningHours('Mo,We,Fr 08:00-17:00');
    expect(result.weekdayDescriptions[0]).toContain('Monday: 08:00-17:00');
    expect(result.weekdayDescriptions[2]).toContain('Wednesday: 08:00-17:00');
    expect(result.weekdayDescriptions[4]).toContain('Friday: 08:00-17:00');
    expect(result.weekdayDescriptions[1]).toContain('?');
  });

  it('MAPS-007 (ReDoS): opening hours regex on adversarial input < 100ms', () => {
    const adversarial = 'Mo' + ',Mo'.repeat(500) + ' closed';
    const start = Date.now();
    parseOpeningHours(adversarial);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

// ── buildOsmDetails ───────────────────────────────────────────────────────────

describe('buildOsmDetails', () => {
  it('MAPS-008: returns website from tags', () => {
    const result = buildOsmDetails({ website: 'https://example.com' }, 'way', '123');
    expect(result.website).toBe('https://example.com');
  });

  it('MAPS-009: prefers contact:website over website', () => {
    const result = buildOsmDetails(
      { 'contact:website': 'https://contact.example.com', website: 'https://other.com' },
      'node',
      '1',
    );
    expect(result.website).toBe('https://contact.example.com');
  });

  it('MAPS-010: returns null website when no tag', () => {
    const result = buildOsmDetails({}, 'node', '1');
    expect(result.website).toBeNull();
  });

  it('MAPS-011: builds correct osm_url', () => {
    const result = buildOsmDetails({}, 'way', '99999');
    expect(result.osm_url).toBe('https://www.openstreetmap.org/way/99999');
  });

  it('MAPS-012: includes parsed opening_hours when valid', () => {
    const result = buildOsmDetails({ opening_hours: 'Mo-Fr 09:00-18:00' }, 'node', '1');
    expect(result.opening_hours).not.toBeNull();
    expect(Array.isArray(result.opening_hours)).toBe(true);
  });

  it('MAPS-013: opening_hours is null when tag is missing', () => {
    const result = buildOsmDetails({}, 'node', '1');
    expect(result.opening_hours).toBeNull();
    expect(result.open_now).toBeNull();
  });

  it('MAPS-014: source is always openstreetmap', () => {
    expect(buildOsmDetails({}, 'node', '1').source).toBe('openstreetmap');
  });

  it('MAPS-014b: opening_hours is null when all days have unknown times (all "?")', () => {
    // "closed" does not match the day+time pattern so all days remain "?"
    const result = buildOsmDetails({ opening_hours: 'closed' }, 'node', '1');
    expect(result.opening_hours).toBeNull();
    expect(result.open_now).toBeNull();
  });
});

// ── getMapsKey ────────────────────────────────────────────────────────────────

describe('getMapsKey', () => {
  it('MAPS-015: returns user key when user has one', () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'user-api-key' });
    expect(getMapsKey(1)).toBe('user-api-key');
  });

  it('MAPS-016: falls back to admin key when user has none', () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: null });
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'admin-api-key' });
    expect(getMapsKey(1)).toBe('admin-api-key');
  });

  it('MAPS-017: returns null when neither user nor admin has a key', () => {
    mockDbGet.mockReturnValue(undefined);
    expect(getMapsKey(1)).toBeNull();
  });
});

// ── reverseGeocode ────────────────────────────────────────────────────────────

describe('reverseGeocode (fetch stubbed)', () => {
  it('MAPS-018: returns name and address from nominatim response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Eiffel Tower',
          display_name: 'Eiffel Tower, Paris, France',
          address: {},
        }),
      }),
    );
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('48.8584', '2.2945');
    expect(result.name).toBe('Eiffel Tower');
    expect(result.address).toBe('Eiffel Tower, Paris, France');
  });

  it('MAPS-019: returns nulls when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('0', '0');
    expect(result.name).toBeNull();
    expect(result.address).toBeNull();
  });

  it('MAPS-019b: falls back to address.tourism when name is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          display_name: 'Some Museum, Paris',
          address: { tourism: 'Some Museum' },
        }),
      }),
    );
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('48.85', '2.35');
    expect(result.name).toBe('Some Museum');
  });

  it('MAPS-019c: falls back to address.amenity when name and tourism are absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          display_name: 'A Cafe, Paris',
          address: { amenity: 'A Cafe' },
        }),
      }),
    );
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('48.85', '2.35');
    expect(result.name).toBe('A Cafe');
  });

  it('MAPS-019d: falls back to address.road when no higher-priority field exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          display_name: 'Rue de Rivoli, Paris',
          address: { road: 'Rue de Rivoli' },
        }),
      }),
    );
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('48.85', '2.35');
    expect(result.name).toBe('Rue de Rivoli');
  });

  it('MAPS-019e: returns null name when address has no recognized fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          display_name: 'Somewhere',
          address: {},
        }),
      }),
    );
    const { reverseGeocode } = await import('../../../src/services/mapsService');
    const result = await reverseGeocode('0', '0');
    expect(result.name).toBeNull();
    expect(result.address).toBe('Somewhere');
  });
});

// Nominatim stub used by resolveGoogleMapsUrl after coordinate extraction
const nominatimStub = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ display_name: 'Paris, France', name: null, address: {} }),
});

// ── resolveGoogleMapsUrl coordinate extraction ────────────────────────────────

describe('resolveGoogleMapsUrl coordinate extraction (ReDoS guards)', () => {
  it('MAPS-020: extracts lat/lng from @lat,lng pattern', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://www.google.com/maps/@48.8566,2.3522,15z');
    expect(result.lat).toBeCloseTo(48.8566, 3);
    expect(result.lng).toBeCloseTo(2.3522, 3);
  });

  it('MAPS-021: extracts lat/lng from !3d!4d data pattern', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl(
      'https://www.google.com/maps/place/Eiffel+Tower/data=!3d48.8584!4d2.2945',
    );
    expect(result.lat).toBeCloseTo(48.8584, 3);
    expect(result.lng).toBeCloseTo(2.2945, 3);
  });

  it('MAPS-022: extracts lat/lng from ?q=lat,lng pattern', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://www.google.com/maps?q=48.8566,2.3522');
    expect(result.lat).toBeCloseTo(48.8566, 3);
    expect(result.lng).toBeCloseTo(2.3522, 3);
  });

  it('MAPS-023: extracts place name from /place/ path', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,15z');
    expect(result.name).toBe('Eiffel Tower');
  });

  it('MAPS-CID-001: resolves a cid= URL by following the redirect to a coordinate URL', async () => {
    // cid URLs (what get_place_details returns, and Google "Share" links) carry no
    // inline coords; the redirect target carries the !3d!4d data param.
    const fetchMock = vi.fn(async (u: string) => {
      if (u.includes('nominatim')) {
        return { ok: true, json: async () => ({ display_name: 'Paris, France', name: 'Eiffel Tower', address: {} }) };
      }
      return { url: 'https://www.google.com/maps/place/Eiffel+Tower/data=!3d48.8584!4d2.2945', text: async () => '' };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://maps.google.com/?cid=1234567890');
    expect(result.lat).toBeCloseTo(48.8584, 3);
    expect(result.lng).toBeCloseTo(2.2945, 3);
  });

  it('MAPS-CID-002: falls back to parsing coordinates from the page body', async () => {
    const fetchMock = vi.fn(async (u: string) => {
      if (u.includes('nominatim')) {
        return { ok: true, json: async () => ({ display_name: 'NYC, USA', name: null, address: {} }) };
      }
      if (u.includes('cid=')) {
        // Redirect target has no inline coords.
        return { url: 'https://www.google.com/maps/place/Somewhere', text: async () => '' };
      }
      // Body fetch of the resolved URL embeds coords in the map data.
      return { url: 'https://www.google.com/maps/place/Somewhere', text: async () => 'x!3d40.6892!4d-74.0445y' };
    });
    vi.stubGlobal('fetch', fetchMock);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://www.google.com/maps?cid=999');
    expect(result.lat).toBeCloseTo(40.6892, 3);
    expect(result.lng).toBeCloseTo(-74.0445, 3);
  });

  it('MAPS-024 (ReDoS): /@(-?\\d+\\.?\\d*),(-?\\d+\\.?\\d*)/ on adversarial input < 500ms', () => {
    const adversarial = '/@' + '1'.repeat(10000) + '.';
    const start = Date.now();
    adversarial.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('MAPS-025 (ReDoS): /!3d(-?\\d+\\.?\\d*)!4d/ on adversarial input < 500ms', () => {
    const adversarial = '!3d' + '1'.repeat(10000) + '.';
    const start = Date.now();
    adversarial.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('MAPS-026 (ReDoS): /[?&]q=(-?\\d+\\.?\\d*)/ on adversarial input < 500ms', () => {
    const adversarial = '?q=' + '1'.repeat(10000) + '.';
    const start = Date.now();
    adversarial.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('MAPS-027 (ReDoS): /<[^>]+>/ HTML strip on adversarial input < 100ms', () => {
    const adversarial = '<' + 'a'.repeat(10000);
    const start = Date.now();
    adversarial.replace(/<[^>]+>/g, '');
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('MAPS-028: throws when no coordinates found in URL', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    await expect(resolveGoogleMapsUrl('https://www.google.com/maps')).rejects.toThrow();
  });

  it('MAPS-028b: throws 403 when short URL is blocked by SSRF check', async () => {
    mockCheckSsrf.mockResolvedValueOnce({ allowed: false });
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    await expect(resolveGoogleMapsUrl('https://goo.gl/maps/abc123')).rejects.toMatchObject({ status: 403 });
  });

  it('MAPS-028c: follows redirect for short goo.gl URL and extracts coordinates', async () => {
    const redirectFetch = vi
      .fn()
      // First call: the redirect (goo.gl), returns resolved URL in .url
      .mockResolvedValueOnce({
        url: 'https://www.google.com/maps/@48.8566,2.3522,15z',
      })
      // Second call: the Nominatim reverse geocode
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_name: 'Paris, France', name: 'Paris', address: {} }),
      });
    vi.stubGlobal('fetch', redirectFetch);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    const result = await resolveGoogleMapsUrl('https://goo.gl/maps/abc123');
    expect(result.lat).toBeCloseTo(48.8566, 3);
    expect(result.lng).toBeCloseTo(2.3522, 3);
  });

  it('MAPS-028d: falls back to nominatim address fields when no placeName in URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: 'Louvre Museum, Paris',
        name: null,
        address: { tourism: 'Louvre Museum' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { resolveGoogleMapsUrl } = await import('../../../src/services/mapsService');
    // URL with coordinates but no /place/ path segment
    const result = await resolveGoogleMapsUrl('https://www.google.com/maps/@48.8606,2.3376,15z');
    expect(result.name).toBe('Louvre Museum');
  });
});

// ── searchNominatim (fetch-dependent) ────────────────────────────────────────

describe('searchNominatim (fetch stubbed)', () => {
  it('MAPS-029: returns mapped nominatim results on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { osm_type: 'way', osm_id: '1', lat: '48.8', lon: '2.3', name: 'Paris', display_name: 'Paris, France' },
        ],
      }),
    );
    const { searchNominatim } = await import('../../../src/services/mapsService');
    const results = await searchNominatim('Paris');
    expect(results).toHaveLength(1);
    expect((results[0] as any).address).toBe('Paris, France');
    expect((results[0] as any).source).toBe('openstreetmap');
  });

  it('MAPS-030: throws on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { searchNominatim } = await import('../../../src/services/mapsService');
    await expect(searchNominatim('fail')).rejects.toThrow();
  });

  it('MAPS-030b: throws when nominatim response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '',
      }),
    );
    const { searchNominatim } = await import('../../../src/services/mapsService');
    await expect(searchNominatim('fail')).rejects.toThrow('Nominatim API error');
  });

  it('MAPS-030c: falls back to display_name split when name is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ osm_type: 'node', osm_id: '2', lat: '51.5', lon: '-0.1', display_name: 'London, UK' }],
      }),
    );
    const { searchNominatim } = await import('../../../src/services/mapsService');
    const results = await searchNominatim('London');
    expect((results[0] as any).name).toBe('London');
  });
});

// ── fetchOverpassDetails (fetch stubbed) ─────────────────────────────────────

describe('fetchOverpassDetails (fetch stubbed)', () => {
  it('MAPS-031: returns element tags on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [{ tags: { name: 'Eiffel Tower', website: 'https://eiffel.com' } }] }),
      }),
    );
    const { fetchOverpassDetails } = await import('../../../src/services/mapsService');
    const result = await fetchOverpassDetails('way', '12345');
    expect(result).toBeDefined();
    expect((result as any).tags.name).toBe('Eiffel Tower');
  });

  it('MAPS-032: returns null for unknown osmType', async () => {
    const { fetchOverpassDetails } = await import('../../../src/services/mapsService');
    const result = await fetchOverpassDetails('unknown', '12345');
    expect(result).toBeNull();
  });

  it('MAPS-033: returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { fetchOverpassDetails } = await import('../../../src/services/mapsService');
    const result = await fetchOverpassDetails('node', '99999');
    expect(result).toBeNull();
  });

  it('MAPS-034: returns null when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { fetchOverpassDetails } = await import('../../../src/services/mapsService');
    const result = await fetchOverpassDetails('node', '99999');
    expect(result).toBeNull();
  });

  it('MAPS-034b: returns null when elements array is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [] }),
      }),
    );
    const { fetchOverpassDetails } = await import('../../../src/services/mapsService');
    const result = await fetchOverpassDetails('node', '1');
    expect(result).toBeNull();
  });
});

// ── fetchWikimediaPhoto (fetch stubbed) ───────────────────────────────────────

describe('fetchWikimediaPhoto (fetch stubbed)', () => {
  it('MAPS-035: returns photo from Wikipedia article image (strategy 1)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: { pages: { '1': { thumbnail: { source: 'https://example.com/thumb.jpg' } } } },
        }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3, 'Eiffel Tower');
    expect(result).toBeDefined();
    expect(result!.photoUrl).toBe('https://example.com/thumb.jpg');
    expect(result!.attribution).toBe('Wikipedia');
  });

  it('MAPS-036: falls through to geosearch when Wikipedia has no thumbnail', async () => {
    const wikiResponse = { ok: true, json: async () => ({ query: { pages: { '-1': {} } } }) };
    const commonsResponse = {
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              imageinfo: [
                { url: 'https://commons.org/img.jpg', mime: 'image/jpeg', extmetadata: { Artist: { value: 'Alice' } } },
              ],
            },
          },
        },
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(wikiResponse).mockResolvedValueOnce(commonsResponse));
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3, 'Some Place');
    expect(result).toBeDefined();
    expect(result!.photoUrl).toBe('https://commons.org/img.jpg');
    expect(result!.attribution).toBe('Alice');
  });

  it('MAPS-036b: geosearch prefers the scaled thumburl over the full-res original', async () => {
    const wikiResponse = { ok: true, json: async () => ({ query: { pages: { '-1': {} } } }) };
    const commonsResponse = {
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              imageinfo: [
                {
                  url: 'https://commons.org/original-16mb.jpg',
                  thumburl: 'https://commons.org/thumb-400.jpg',
                  mime: 'image/jpeg',
                  extmetadata: { Artist: { value: 'Alice' } },
                },
              ],
            },
          },
        },
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(wikiResponse).mockResolvedValueOnce(commonsResponse));
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3, 'Some Place');
    expect(result).toBeDefined();
    expect(result!.photoUrl).toBe('https://commons.org/thumb-400.jpg');
    expect(result!.attribution).toBe('Alice');
  });

  it('MAPS-037: returns null when both strategies find nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ query: { pages: {} } }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result).toBeNull();
  });

  it('MAPS-037b: skips strategy 1 entirely when name is undefined', async () => {
    // Only one fetch call is made (the Commons geosearch), not two
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    await fetchWikimediaPhoto(48.8, 2.3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('MAPS-037c: falls through to geosearch when Wikipedia fetch throws', async () => {
    const commonsResponse = {
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              imageinfo: [{ url: 'https://commons.org/fallback.jpg', mime: 'image/png', extmetadata: {} }],
            },
          },
        },
      }),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(new Error('Wikipedia network error')).mockResolvedValueOnce(commonsResponse),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3, 'Some Place');
    expect(result).toBeDefined();
    expect(result!.photoUrl).toBe('https://commons.org/fallback.jpg');
    // no Artist in extmetadata -> attribution null
    expect(result!.attribution).toBeNull();
  });

  it('MAPS-037d: falls through to geosearch when Wikipedia response is not ok', async () => {
    const wikiNotOk = { ok: false };
    const commonsResponse = {
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              imageinfo: [
                {
                  url: 'https://commons.org/photo.jpg',
                  mime: 'image/jpeg',
                  extmetadata: { Artist: { value: '<b>Bob</b>' } },
                },
              ],
            },
          },
        },
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(wikiNotOk).mockResolvedValueOnce(commonsResponse));
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3, 'Some Place');
    expect(result).toBeDefined();
    // HTML tags stripped from attribution
    expect(result!.attribution).toBe('Bob');
  });

  it('MAPS-037e: returns null when Commons geosearch returns not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result).toBeNull();
  });

  it('MAPS-037f: returns null when Commons geosearch returns no query.pages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ query: {} }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result).toBeNull();
  });

  it('MAPS-037g: returns null when Commons fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Commons network error')));
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result).toBeNull();
  });

  it('MAPS-037h: skips Commons page entries with non-photo MIME type (SVG)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              '1': {
                imageinfo: [{ url: 'https://commons.org/diagram.svg', mime: 'image/svg+xml' }],
              },
            },
          },
        }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result).toBeNull();
  });

  it('MAPS-037i: accepts PNG mime type as valid photo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              '1': {
                imageinfo: [
                  {
                    url: 'https://commons.org/photo.png',
                    mime: 'image/png',
                    extmetadata: { Artist: { value: 'Carol' } },
                  },
                ],
              },
            },
          },
        }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result!.photoUrl).toBe('https://commons.org/photo.png');
    expect(result!.attribution).toBe('Carol');
  });

  it('MAPS-037j: returns null attribution when Artist extmetadata is absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              '1': {
                imageinfo: [{ url: 'https://commons.org/noattr.jpg', mime: 'image/jpeg', extmetadata: {} }],
              },
            },
          },
        }),
      }),
    );
    const { fetchWikimediaPhoto } = await import('../../../src/services/mapsService');
    const result = await fetchWikimediaPhoto(48.8, 2.3);
    expect(result!.attribution).toBeNull();
  });
});

// ── searchPlaces (fetch stubbed) ─────────────────────────────────────────────

describe('searchPlaces (fetch stubbed)', () => {
  it('MAPS-038: uses Nominatim when user has no API key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { osm_type: 'node', osm_id: '1', lat: '48.8', lon: '2.3', display_name: 'Paris, France', name: 'Paris' },
        ],
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    const result = await searchPlaces(999, 'Paris');
    expect(result.source).toBe('openstreetmap');
    expect(Array.isArray(result.places)).toBe(true);
  });

  it('MAPS-039: uses Google when user has an API key', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'ENCRYPTED' }).mockReturnValueOnce(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          places: [
            {
              id: 'gid1',
              displayName: { text: 'Eiffel Tower' },
              formattedAddress: 'Paris',
              location: { latitude: 48.8, longitude: 2.3 },
              // Real search API returns a cid-style URL with no ftid → google_ftid stays null.
              googleMapsUri: 'https://maps.google.com/?cid=10403719659250533155',
            },
          ],
        }),
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    const result = await searchPlaces(1, 'Eiffel Tower');
    expect(result.source).toBe('google');
    expect((result.places[0] as any).google_place_id).toBe('gid1');
    expect((result.places[0] as any).google_ftid).toBeNull();
  });

  it('MAPS-039b: throws with Google error status when Google API returns non-ok', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'API key invalid' } }),
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    await expect(searchPlaces(1, 'anything')).rejects.toMatchObject({
      message: 'API key invalid',
      status: 403,
    });
  });

  it('MAPS-039c: throws with generic message when Google error has no message', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: {} }),
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    await expect(searchPlaces(1, 'anything')).rejects.toMatchObject({
      message: 'Google Places API error',
      status: 500,
    });
  });

  it('MAPS-039d: returns empty places array when Google returns no results', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    const result = await searchPlaces(1, 'very obscure place');
    expect(result.source).toBe('google');
    expect(result.places).toHaveLength(0);
  });

  it('MAPS-039e: handles Google result with optional fields absent', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          // id only, no displayName, formattedAddress, location, etc.
          places: [{ id: 'gid-sparse' }],
        }),
      }),
    );
    const { searchPlaces } = await import('../../../src/services/mapsService');
    const result = await searchPlaces(1, 'sparse');
    const place = result.places[0] as any;
    expect(place.google_place_id).toBe('gid-sparse');
    expect(place.google_ftid).toBeNull();
    expect(place.name).toBe('');
    expect(place.address).toBe('');
    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
    expect(place.rating).toBeNull();
    expect(place.website).toBeNull();
    expect(place.phone).toBeNull();
  });
});

// ── autocompletePlaces (fetch stubbed) ──────────────────────────────────────

describe('autocompletePlaces (fetch stubbed)', () => {
  it('MAPS-081: uses Nominatim when user has no API key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            osm_type: 'node',
            osm_id: '1',
            lat: '48.8',
            lon: '2.3',
            display_name: 'Paris, Île-de-France, France',
            name: 'Paris',
          },
        ],
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(999, 'Paris');
    expect(result.source).toBe('nominatim');
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].mainText).toBe('Paris');
    expect(result.suggestions[0].placeId).toBe('node:1');
  });

  it('MAPS-082: uses Google when user has an API key', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'ENCRYPTED' }).mockReturnValueOnce(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [
            {
              placePrediction: {
                placeId: 'ChIJ1234',
                structuredFormat: {
                  mainText: { text: 'Eiffel Tower' },
                  secondaryText: { text: 'Paris, France' },
                },
              },
            },
          ],
        }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(1, 'Eiffel');
    expect(result.source).toBe('google');
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].placeId).toBe('ChIJ1234');
    expect(result.suggestions[0].mainText).toBe('Eiffel Tower');
    expect(result.suggestions[0].secondaryText).toBe('Paris, France');
  });

  it('MAPS-083: throws with Google error status when API returns non-ok', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'API key invalid' } }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    await expect(autocompletePlaces(1, 'anything')).rejects.toMatchObject({
      message: 'API key invalid',
      status: 403,
    });
  });

  it('MAPS-084: throws generic message when Google error has no message', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: {} }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    await expect(autocompletePlaces(1, 'anything')).rejects.toMatchObject({
      message: 'Google Places Autocomplete error',
      status: 500,
    });
  });

  it('MAPS-085: returns empty suggestions when Google returns no results', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ suggestions: [] }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(1, 'very obscure place');
    expect(result.source).toBe('google');
    expect(result.suggestions).toHaveLength(0);
  });

  it('MAPS-086: filters out suggestions without placePrediction', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [
            { placePrediction: { placeId: 'A', structuredFormat: { mainText: { text: 'Good' } } } },
            { queryPrediction: { text: 'some query' } },
            { placePrediction: { placeId: 'B', structuredFormat: { mainText: { text: 'Also Good' } } } },
          ],
        }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(1, 'test');
    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions[0].placeId).toBe('A');
    expect(result.suggestions[1].placeId).toBe('B');
  });

  it('MAPS-087: limits results to 5 suggestions', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    const manySuggestions = Array.from({ length: 10 }, (_, i) => ({
      placePrediction: {
        placeId: `id-${i}`,
        structuredFormat: { mainText: { text: `Place ${i}` } },
      },
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ suggestions: manySuggestions }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(1, 'test');
    expect(result.suggestions).toHaveLength(5);
  });

  it('MAPS-088: includes locationBias in Google request when provided', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'test-key' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    await autocompletePlaces(1, 'test', 'en', { low: { lat: 48.5, lng: 2.0 }, high: { lat: 49.0, lng: 2.8 } });

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.locationBias).toEqual({
      rectangle: {
        low: { latitude: 48.5, longitude: 2.0 },
        high: { latitude: 49.0, longitude: 2.8 },
      },
    });
  });

  it('MAPS-089: omits locationBias from Google request when not provided', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'test-key' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    await autocompletePlaces(1, 'test', 'en');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.locationBias).toBeUndefined();
  });

  it('MAPS-090: handles missing structuredFormat fields gracefully', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'some-key' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [{ placePrediction: { placeId: 'sparse-id' } }],
        }),
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(1, 'sparse');
    expect(result.suggestions[0].placeId).toBe('sparse-id');
    expect(result.suggestions[0].mainText).toBe('');
    expect(result.suggestions[0].secondaryText).toBe('');
  });

  it('MAPS-091: Nominatim fallback returns empty suggestions on searchNominatim error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(999, 'fail');
    expect(result.source).toBe('nominatim');
    expect(result.suggestions).toHaveLength(0);
  });

  it('MAPS-092: Nominatim fallback splits address into mainText and secondaryText', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            osm_type: 'way',
            osm_id: '42',
            lat: '51.5',
            lon: '-0.1',
            display_name: 'Big Ben, Westminster, London, UK',
            name: 'Big Ben',
          },
        ],
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(999, 'Big Ben');
    expect(result.suggestions[0].mainText).toBe('Big Ben');
    expect(result.suggestions[0].secondaryText).toBe('Westminster, London, UK');
  });

  it('MAPS-093: Nominatim fallback filters out results with empty osm_id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { osm_type: 'node', osm_id: '1', lat: '48.8', lon: '2.3', display_name: 'Paris, France', name: 'Paris' },
          { osm_type: 'node', osm_id: '', lat: '51.5', lon: '-0.1', display_name: 'London, UK', name: 'London' },
          { osm_type: 'way', osm_id: '3', lat: '52.5', lon: '13.4', display_name: 'Berlin, Germany', name: 'Berlin' },
        ],
      }),
    );
    const { autocompletePlaces } = await import('../../../src/services/mapsService');
    const result = await autocompletePlaces(999, 'test');
    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions.map((s) => s.placeId)).toEqual(['node:1', 'way:3']);
  });
});

// ── getPlaceDetails (fetch stubbed) ─────────────────────────────────────────

describe('getPlaceDetails (fetch stubbed)', () => {
  it('MAPS-040: handles OSM placeId (way:id) via Overpass', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [{ tags: { website: 'https://eiffel.com' } }] }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'way:12345');
    expect(result.place).toBeDefined();
    expect((result.place as any).source).toBe('openstreetmap');
    expect((result.place as any).website).toBe('https://eiffel.com');
  });

  it('MAPS-040b: handles OSM placeId when Overpass returns no tags (element missing)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [] }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'node:99999');
    expect((result.place as any).source).toBe('openstreetmap');
    expect((result.place as any).website).toBeNull();
  });

  it('MAPS-041: throws 400 when Google placeId given but no API key', async () => {
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    await expect(getPlaceDetails(999, 'ChIJNotAnOsmId')).rejects.toMatchObject({ status: 400 });
  });

  it('MAPS-041b: returns full Google place details on happy path', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ChIJ123',
          displayName: { text: 'Eiffel Tower' },
          formattedAddress: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
          location: { latitude: 48.8584, longitude: 2.2945 },
          rating: 4.7,
          userRatingCount: 200000,
          websiteUri: 'https://www.toureiffel.paris',
          nationalPhoneNumber: '+33 892 70 12 39',
          regularOpeningHours: {
            weekdayDescriptions: ['Monday: 9:00 AM – 12:00 AM'],
            openNow: true,
          },
          // The Places API returns a cid-style URL with no ftid, so google_ftid stays null
          // and the precise query_place_id link is used on the client instead.
          googleMapsUri: 'https://maps.google.com/?cid=10403719659250533155',
          editorialSummary: { text: 'Iconic iron tower.' },
          reviews: [
            {
              authorAttribution: { displayName: 'John', photoUri: 'https://photo.url' },
              rating: 5,
              text: { text: 'Amazing!' },
              relativePublishTimeDescription: '2 weeks ago',
            },
          ],
          photos: [{ name: 'places/ChIJ123/photos/photo1', authorAttributions: [{ displayName: 'Jane' }] }],
        }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'ChIJ123');
    const place = result.place as any;
    expect(place.google_place_id).toBe('ChIJ123');
    expect(place.google_ftid).toBeNull();
    expect(place.name).toBe('Eiffel Tower');
    expect(place.rating).toBe(4.7);
    expect(place.rating_count).toBe(200000);
    expect(place.open_now).toBe(true);
    expect(place.source).toBe('google');
    // Lean mask — reviews/summary not fetched in getPlaceDetails; use getPlaceDetailsExpanded for those
    expect(place.reviews).toHaveLength(0);
    expect(place.summary).toBeNull();
  });

  it('MAPS-041b2: normalises non-standard TREK language codes for Google (br→pt-BR, gr→el)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'ChIJ1', displayName: { text: 'X' }, location: { latitude: 0, longitude: 0 } }),
    });
    mockDbGet.mockReturnValue({ maps_api_key: 'gkey' });
    vi.stubGlobal('fetch', fetchMock);
    const { getPlaceDetails } = await import('../../../src/services/mapsService');

    await getPlaceDetails(1, 'ChIJ-br', 'br');
    expect(String(fetchMock.mock.calls[0][0])).toContain('languageCode=pt-BR');

    await getPlaceDetails(1, 'ChIJ-gr', 'gr');
    expect(String(fetchMock.mock.calls[1][0])).toContain('languageCode=el');

    // A code that is already valid passes through unchanged.
    await getPlaceDetails(1, 'ChIJ-de', 'de');
    expect(String(fetchMock.mock.calls[2][0])).toContain('languageCode=de');
  });

  it('MAPS-041c: throws with status when Google API returns non-ok response', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Place not found' } }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    await expect(getPlaceDetails(1, 'ChIJMissing')).rejects.toMatchObject({
      message: 'Place not found',
      status: 404,
    });
  });

  it('MAPS-041d: getPlaceDetailsExpanded maps reviews with optional fields absent to null', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    // expanded=1 cache miss → return undefined
    mockDbGet.mockReturnValueOnce(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ChIJ456',
          reviews: [
            // All optional fields absent
            {},
          ],
        }),
      }),
    );
    const { getPlaceDetailsExpanded } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetailsExpanded(1, 'ChIJ456');
    const review = (result.place as any).reviews[0];
    expect(review.author).toBeNull();
    expect(review.rating).toBeNull();
    expect(review.text).toBeNull();
    expect(review.time).toBeNull();
    expect(review.photo).toBeNull();
  });

  it('MAPS-040c: OSM path enriches name/address/coords from Nominatim (serial fetch)', async () => {
    const fetchMock = vi
      .fn()
      // First call: Overpass (returns element with tags but no coords)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ elements: [{ tags: { website: 'https://example.com' } }] }),
      })
      // Second call: Nominatim /lookup
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            osm_type: 'way',
            osm_id: '5',
            lat: '48.85',
            lon: '2.29',
            display_name: 'Eiffel Tower, Paris, France',
            name: 'Eiffel Tower',
          },
        ],
      });
    vi.stubGlobal('fetch', fetchMock);
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'way:5');
    const place = result.place as any;
    expect(place.name).toBe('Eiffel Tower');
    expect(place.address).toBe('Eiffel Tower, Paris, France');
    expect(place.lat).toBeCloseTo(48.85);
    expect(place.lng).toBeCloseTo(2.29);
    expect(place.source).toBe('openstreetmap');
    // Overpass first, then Nominatim — two total fetch calls
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const overpassUrl = fetchMock.mock.calls[0][0] as string;
    const nominatimUrl = fetchMock.mock.calls[1][0] as string;
    expect(overpassUrl).toContain('overpass');
    expect(nominatimUrl).toContain('nominatim');
  });

  it('MAPS-041e: open_now is null when regularOpeningHours.openNow is undefined', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ChIJ789',
          regularOpeningHours: {
            weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
            // openNow intentionally absent
          },
        }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'ChIJ789');
    expect((result.place as any).open_now).toBeNull();
  });

  it('MAPS-041f: open_now is false when regularOpeningHours.openNow is false', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ChIJClosed',
          regularOpeningHours: {
            weekdayDescriptions: ['Monday: 9:00 AM – 5:00 PM'],
            openNow: false,
          },
        }),
      }),
    );
    const { getPlaceDetails } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetails(1, 'ChIJClosed');
    // false is preserved (not coerced to null) via the ?? null operator
    expect((result.place as any).open_now).toBe(false);
  });

  it('MAPS-041g: getPlaceDetailsExpanded truncates reviews to first 5 entries', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    // expanded=1 cache miss
    mockDbGet.mockReturnValueOnce(undefined);
    const manyReviews = Array.from({ length: 8 }, (_, i) => ({
      authorAttribution: { displayName: `User${i}` },
      rating: 4,
      text: { text: 'Good' },
      relativePublishTimeDescription: '1 day ago',
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'ChIJMany', reviews: manyReviews }),
      }),
    );
    const { getPlaceDetailsExpanded } = await import('../../../src/services/mapsService');
    const result = await getPlaceDetailsExpanded(1, 'ChIJMany');
    expect((result.place as any).reviews).toHaveLength(5);
  });
});

// ── getPlacePhoto (fetch stubbed) ────────────────────────────────────────────

describe('getPlacePhoto (fetch stubbed)', () => {
  it('MAPS-042: returns proxy URL for coordinate-based lookup via Wikimedia (no API key)', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // First call: Wikimedia Commons API
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            query: { pages: { '1': { thumbnail: { source: 'https://wiki.org/photo.jpg' } } } },
          }),
        })
        // Second call: fetch Wikimedia image bytes
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(100),
        }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const placeId = 'coords:48.8,2.3';
    const result = await getPlacePhoto(999, placeId, 48.8, 2.3, 'Eiffel Tower');
    expect(result.photoUrl).toBe(`/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`);
    expect(mockCachePut).toHaveBeenCalledOnce();
  });

  it('MAPS-043: throws 404 when Wikimedia returns nothing and no API key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ query: { pages: {} } }),
      }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    await expect(getPlacePhoto(999, 'coords:0.0,0.0', 0, 0)).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-043b: returns cached photo when disk cache returns a hit', async () => {
    const placeId = `coords:cache-test-${Date.now()}`;
    const cachedUrl = `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`;
    mockCacheGet.mockReturnValue({
      photoUrl: cachedUrl,
      filePath: `/tmp/${placeId}.jpg`,
      attribution: null,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const result = await getPlacePhoto(999, placeId, 48.8, 2.3, 'Cache Test');
    expect(result.photoUrl).toBe(cachedUrl);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('MAPS-043c: throws 404 from error cache without making a network request', async () => {
    mockCacheGetErrored.mockReturnValue(true);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const errorId = `coords:error-cache-${Date.now()}`;
    await expect(getPlacePhoto(999, errorId, 0, 0)).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('MAPS-043d: throws 404 when lat/lng are NaN and no API key', async () => {
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const nanId = `coords:nan-test-${Date.now()}`;
    await expect(getPlacePhoto(999, nanId, NaN, NaN)).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-043e: falls through and throws 404 when Wikimedia fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network fail')));
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const throwId = `coords:throw-test-${Date.now()}`;
    await expect(getPlacePhoto(999, throwId, 48.8, 2.3, 'Place')).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-044: returns proxy URL via Google path when API key present and photos exist', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    const fetchMock = vi
      .fn()
      // First call: get place details (with photos)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            photos: [{ name: 'places/ChIJABC/photos/photo1', authorAttributions: [{ displayName: 'Photographer' }] }],
          }),
      })
      // Second call: fetch image bytes
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(200),
      });
    vi.stubGlobal('fetch', fetchMock);
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const uniqueId = `ChIJABC-${Date.now()}`;
    const result = await getPlacePhoto(1, uniqueId, 48.8, 2.3, 'Place');
    expect(result.photoUrl).toBe(`/api/maps/place-photo/${encodeURIComponent(uniqueId)}/bytes`);
    expect(result.attribution).toBe('Photographer');
    expect(mockCachePut).toHaveBeenCalledOnce();
  });

  it('MAPS-044b: throws 404 when Google details fetch returns non-ok', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { message: 'Forbidden' } }),
      }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const errId = `ChIJErr-${Date.now()}`;
    await expect(getPlacePhoto(1, errId, 48.8, 2.3)).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-044c: throws 404 when Google place has no photos', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ photos: [] }),
      }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const noPhotoId = `ChIJNone-${Date.now()}`;
    await expect(getPlacePhoto(1, noPhotoId, 48.8, 2.3)).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-044d: throws 404 when media endpoint returns non-ok status', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            photos: [{ name: 'places/ChIJXYZ/photos/photo1', authorAttributions: [] }],
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        arrayBuffer: async () => new ArrayBuffer(0),
      });
    vi.stubGlobal('fetch', fetchMock);
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const noUriId = `ChIJXYZ-${Date.now()}`;
    await expect(getPlacePhoto(1, noUriId, 48.8, 2.3)).rejects.toMatchObject({ status: 404 });
  });

  it('MAPS-044e: returns proxy URL with null attribution when authorAttributions is empty', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            photos: [{ name: 'places/ChIJNoAttr/photos/photo1', authorAttributions: [] }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(150),
      });
    vi.stubGlobal('fetch', fetchMock);
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const noAttrId = `ChIJNoAttr-${Date.now()}`;
    const result = await getPlacePhoto(1, noAttrId, 48.8, 2.3);
    expect(result.photoUrl).toBe(`/api/maps/place-photo/${encodeURIComponent(noAttrId)}/bytes`);
    expect(result.attribution).toBeNull();
  });

  it('MAPS-044f: uses Wikimedia and returns proxy URL when API key present but placeId is coords: prefix', async () => {
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            query: { pages: { '1': { thumbnail: { source: 'https://wiki.org/coords-photo.jpg' } } } },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(120),
        }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const uniqueId = `coords:44f-test-${Date.now()}`;
    const result = await getPlacePhoto(1, uniqueId, 48.8, 2.3, 'Coords Place');
    expect(result.photoUrl).toBe(`/api/maps/place-photo/${encodeURIComponent(uniqueId)}/bytes`);
    expect(mockCachePut).toHaveBeenCalledOnce();
  });

  it('MAPS-044g: falls back to Wikipedia/OSM for a Google place_id when the Google photo call fails', async () => {
    // A key is present and the placeId is a Google id, but Google rejects the
    // photo request (e.g. 403). The lookup must still return an image via the
    // coordinate-based Wikipedia fallback instead of giving up with a 404 —
    // matching what right-click (coords:) places already do.
    mockDbGet.mockReturnValueOnce({ maps_api_key: 'gkey' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // 1) Google photo details → 403
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => JSON.stringify({ error: { message: 'PERMISSION_DENIED' } }),
        })
        // 2) Wikipedia pageimages → thumbnail
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ query: { pages: { '1': { thumbnail: { source: 'https://wiki.org/guinness.jpg' } } } } }),
        })
        // 3) image bytes
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(200),
        }),
    );
    const { getPlacePhoto } = await import('../../../src/services/mapsService');
    const placeId = `ChIJFallback-${Date.now()}`;
    const result = await getPlacePhoto(1, placeId, 53.34, -6.28, 'Guinness Storehouse');
    expect(result.photoUrl).toBe(`/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`);
    expect(result.attribution).toBe('Wikipedia');
    expect(mockCachePut).toHaveBeenCalledOnce();
  });
});

describe('googleFtidFromMapsUrl', () => {
  it('MAPS-FTID-001: extracts a valid ftid from a /place/?ftid= URL (resolved share link)', () => {
    expect(
      googleFtidFromMapsUrl('https://www.google.com/maps/place/?q=X&ftid=0x882bf179e806d471:0x8591dde29c821a93'),
    ).toBe('0x882bf179e806d471:0x8591dde29c821a93');
  });
  it('MAPS-FTID-002: returns null for a cid-style URL (the usual Places API shape)', () => {
    expect(googleFtidFromMapsUrl('https://maps.google.com/?cid=10403719659250533155')).toBeNull();
  });
  it('MAPS-FTID-003: rejects malformed / hostile ftid values', () => {
    expect(googleFtidFromMapsUrl('https://maps.google.com/?ftid=not-an-ftid')).toBeNull();
    expect(googleFtidFromMapsUrl('https://maps.google.com/?ftid=0xAB%26q%3Devil%3Cscript%3E')).toBeNull();
    expect(googleFtidFromMapsUrl('not a url')).toBeNull();
    expect(googleFtidFromMapsUrl(null)).toBeNull();
  });
});

// ── buildUserAgent (instance-specific UA, #1309) ──────────────────────────────

describe('buildUserAgent', () => {
  const base = 'TREK Travel Planner (https://github.com/liketrek/TREK)';

  it('MAPS-094: returns the bare base UA when no instance URL is configured', () => {
    expect(buildUserAgent(undefined)).toBe(base);
    expect(buildUserAgent('')).toBe(base);
  });

  it('MAPS-095: appends a configured https instance URL so the deployment is identifiable', () => {
    expect(buildUserAgent('https://trek.example.org')).toBe(`${base}; https://trek.example.org`);
  });

  it('MAPS-096: drops the http://localhost fallback — it is not a unique identifier', () => {
    expect(buildUserAgent('http://localhost:3001')).toBe(base);
  });
});

// ── resolveOverpassEndpoints (OVERPASS_URL override, #1309) ────────────────────

describe('resolveOverpassEndpoints', () => {
  it('MAPS-097: falls back to the public mirrors when OVERPASS_URL is unset/empty', () => {
    expect(resolveOverpassEndpoints(undefined).length).toBeGreaterThan(1);
    expect(resolveOverpassEndpoints('').length).toBeGreaterThan(1);
    expect(resolveOverpassEndpoints(undefined)[0]).toContain('overpass-api.de');
  });

  it('MAPS-098: a single custom endpoint REPLACES the public mirrors (locked-down egress)', () => {
    expect(resolveOverpassEndpoints('https://overpass.internal/api/interpreter')).toEqual([
      'https://overpass.internal/api/interpreter',
    ]);
  });

  it('MAPS-099: parses a comma-separated list and trims whitespace', () => {
    expect(resolveOverpassEndpoints(' https://a.test/api , http://b.test/api ')).toEqual([
      'https://a.test/api',
      'http://b.test/api',
    ]);
  });

  it('MAPS-100: drops non-http(s) / malformed entries, keeping the valid ones', () => {
    expect(resolveOverpassEndpoints('https://ok.test/api, ftp://no.test, not a url')).toEqual(['https://ok.test/api']);
  });

  it('MAPS-101: falls back to the defaults when every custom entry is invalid', () => {
    expect(resolveOverpassEndpoints('not a url, ftp://no.test').length).toBeGreaterThan(1);
  });
});

// ── resolveOverpassTimeoutMs (OVERPASS_TIMEOUT_MS override, #1309) ─────────────

describe('resolveOverpassTimeoutMs', () => {
  it('MAPS-104: falls back to the 12s default for unset / empty / non-numeric values', () => {
    expect(resolveOverpassTimeoutMs(undefined)).toBe(12000);
    expect(resolveOverpassTimeoutMs('')).toBe(12000);
    expect(resolveOverpassTimeoutMs('abc')).toBe(12000);
  });

  it('MAPS-105: honours a positive numeric override', () => {
    expect(resolveOverpassTimeoutMs('30000')).toBe(30000);
  });

  it('MAPS-106: rejects 0, negative and Infinity — a non-positive cap would 502 every search', () => {
    expect(resolveOverpassTimeoutMs('0')).toBe(12000);
    expect(resolveOverpassTimeoutMs('-5')).toBe(12000);
    expect(resolveOverpassTimeoutMs('Infinity')).toBe(12000);
  });
});

// ── searchOverpassPois error path (all endpoints down, #1309) ──────────────────

describe('searchOverpassPois all-endpoints-down', () => {
  const bbox = { south: -41.2, west: 146.31, north: -41.16, east: 146.37 };

  it('MAPS-102: surfaces a 502 with a clear message when every Overpass endpoint fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));
    await expect(searchOverpassPois('restaurant', bbox)).rejects.toMatchObject({
      status: 502,
      message: 'Could not reach any Overpass endpoint',
    });
    errSpy.mockRestore();
  });

  it('MAPS-103: logs each endpoint failure so an operator can diagnose blocked egress', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));
    await expect(searchOverpassPois('bar', bbox)).rejects.toThrow();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('[Overpass] all'));
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('ECONNREFUSED'));
    errSpy.mockRestore();
  });
});
