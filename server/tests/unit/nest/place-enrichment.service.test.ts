/**
 * Unit tests for PlaceEnrichmentService — ENRICH-001 through ENRICH-030.
 *
 * The service is a fan-out over MapsService primitives plus the shared photo
 * cache, so both are injected as stubs and every provider branch is driven from
 * the test. The SSRF guard is mocked the same way maps.service.test.ts mocks it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbGet, mockDbRun, mockSafeFetchFollow } = vi.hoisted(() => ({
  mockDbGet: vi.fn(() => undefined as any),
  mockDbRun: vi.fn(),
  mockSafeFetchFollow: vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer })),
}));

// prepare() takes the SQL and the statement takes the params, so the spies get
// the statement text folded back in as their first argument — the assertions
// below distinguish the settings read from the cache read by exactly that.
vi.mock('../../../src/db/database', () => ({
  db: {
    prepare: (sql: string) => ({
      get: (...params: unknown[]) => mockDbGet(sql, ...params),
      run: (...params: unknown[]) => mockDbRun(sql, ...params),
      all: () => [],
    }),
  },
}));

vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetchFollow: mockSafeFetchFollow,
  checkSsrf: vi.fn(async () => ({ allowed: true })),
  SsrfBlockedError: class extends Error {},
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PlaceEnrichmentService, creditLine, collectFacts } from '../../../src/nest/place-enrichment/place-enrichment.service';
import type { MapsService } from '../../../src/nest/maps/maps.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

const REQ = { lat: 50.9, lng: 6.96, name: 'Museum Ludwig', placeId: 'ChIJmuseum' };
const OSM_REQ = { ...REQ, placeId: 'way:12345' };

/** Every MapsService seam the service touches, all inert by default. */
function mapsStub(over: Partial<Record<keyof MapsService, unknown>> = {}) {
  return {
    getMapsKey: vi.fn(() => null as string | null),
    photosDisabled: vi.fn(() => false),
    detailsDisabled: vi.fn(() => false),
    fetchGooglePhotoRefs: vi.fn(async () => [] as { name: string; attribution: string | null }[]),
    fetchGooglePhotoBytes: vi.fn(async () => null as Buffer | null),
    fetchCommonsCandidates: vi.fn(async () => [] as any[]),
    fetchEditorialSummary: vi.fn(async () => null as string | null),
    fetchWikiExtract: vi.fn(async () => null as { text: string; sourceUrl: string; source: 'wikivoyage' | 'wikipedia' } | null),
    fetchCommonsCategoryCandidates: vi.fn(async () => [] as any[]),
    details: vi.fn(async () => ({ place: null })),
    ...over,
  } as unknown as MapsService;
}

function cacheStub(over: Record<string, unknown> = {}) {
  return {
    get: vi.fn(() => null as any),
    put: vi.fn(async (key: string, _bytes: Buffer, attribution: string | null) => ({
      photoUrl: `/api/maps/place-photo/${encodeURIComponent(key)}/bytes`,
      filePath: `/tmp/${key}.jpg`,
      attribution,
    })),
    ...over,
  } as unknown as PlacePhotoCacheService;
}

function make(maps: MapsService, cache: PlacePhotoCacheService) {
  return new PlaceEnrichmentService(new DatabaseService(db as never), maps, cache);
}

const commonsCandidate = (over: Record<string, unknown> = {}) => ({
  photoUrl: 'https://commons.org/thumb.jpg',
  attribution: 'Alice',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  ...over,
});

beforeEach(() => {
  mockDbGet.mockReset();
  mockDbGet.mockReturnValue(undefined);
  mockDbRun.mockReset();
  mockSafeFetchFollow.mockReset();
  mockSafeFetchFollow.mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
});

// ── Kill switch ──────────────────────────────────────────────────────────────

describe('enrichDisabled', () => {
  it('ENRICH-001: is off only when the setting is literally "false"', () => {
    const svc = make(mapsStub(), cacheStub());

    mockDbGet.mockReturnValue(undefined);
    expect(svc.enrichDisabled()).toBe(false); // never configured — fail open

    mockDbGet.mockReturnValue({ value: 'true' });
    expect(svc.enrichDisabled()).toBe(false);

    mockDbGet.mockReturnValue({ value: 'false' });
    expect(svc.enrichDisabled()).toBe(true);
  });

  it('ENRICH-002: answers the disabled envelope without touching a provider', async () => {
    const maps = mapsStub();
    mockDbGet.mockReturnValue({ value: 'false' });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out).toEqual({ photos: [], description: null, facts: [], disabled: true });
    expect(maps.fetchCommonsCandidates).not.toHaveBeenCalled();
    expect(maps.details).not.toHaveBeenCalled();
  });
});

// ── Photos ───────────────────────────────────────────────────────────────────

describe('collectPhotos', () => {
  it('ENRICH-003: returns Commons candidates with their licence intact', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toEqual([
      {
        key: 'ChIJmuseum~p0',
        url: '/api/maps/place-photo/ChIJmuseum~p0/bytes',
        attribution: 'Alice',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
        source: 'wikimedia',
      },
    ]);
  });

  it('ENRICH-004: works without a Google key, which is the normal instance', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => null),
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(maps.fetchGooglePhotoRefs).not.toHaveBeenCalled();
  });

  it('ENRICH-005: puts Google pictures ahead of Commons when a key is configured', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      fetchGooglePhotoRefs: vi.fn(async () => [{ name: 'places/p/photos/a', attribution: 'Bob' }]),
      fetchGooglePhotoBytes: vi.fn(async () => Buffer.from([1, 2, 3])),
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos.map((p) => p.source)).toEqual(['google', 'wikimedia']);
    expect(out.photos[0]).toMatchObject({
      key: 'ChIJmuseum~p0',
      attribution: 'Bob',
      // Google grants no reusable licence — the fields stay empty rather than invented.
      license: null,
      licenseUrl: null,
      sourceUrl: null,
    });
    expect(out.photos[1].key).toBe('ChIJmuseum~p1');
  });

  it('ENRICH-006: respects the existing photos kill switch for the Google half', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      photosDisabled: vi.fn(() => true),
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(maps.fetchGooglePhotoRefs).not.toHaveBeenCalled();
    expect(out.photos.map((p) => p.source)).toEqual(['wikimedia']);
  });

  it('ENRICH-007: never asks Google about an OSM place', async () => {
    const maps = mapsStub({ getMapsKey: vi.fn(() => 'key') });

    await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchGooglePhotoRefs).not.toHaveBeenCalled();
  });

  it('ENRICH-008: reuses a cached candidate instead of downloading it again', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    const cache = cacheStub({
      get: vi.fn(() => ({ photoUrl: '/api/maps/place-photo/ChIJmuseum~p0/bytes', filePath: '/tmp/x', attribution: 'Alice' })),
    });

    const out = await make(maps, cache).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(mockSafeFetchFollow).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('ENRICH-009: skips a candidate whose bytes will not download', async () => {
    const maps = mapsStub({
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate({ photoUrl: 'https://commons.org/gone.jpg' }), commonsCandidate()]),
    });
    mockSafeFetchFollow
      .mockResolvedValueOnce({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([9]).buffer });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    // The survivor keeps index 1 — keys number the provider's list, so a picture
    // that fails leaves a gap instead of renumbering the ones behind it. Keys
    // have to point at the same file on the next request.
    expect(out.photos).toHaveLength(1);
    expect(out.photos[0].key).toBe('ChIJmuseum~p1');
  });

  it('ENRICH-010: treats an empty body and a throwing download as a miss', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });

    mockSafeFetchFollow.mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    expect((await make(maps, cacheStub()).enrich(1, REQ)).photos).toEqual([]);

    mockSafeFetchFollow.mockRejectedValue(new Error('network'));
    expect((await make(maps, cacheStub()).enrich(1, REQ)).photos).toEqual([]);
  });

  it('ENRICH-011: drops a candidate the cache refuses to store', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    const cache = cacheStub({ put: vi.fn(async () => { throw new Error('disk full'); }) });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const out = await make(maps, cache).enrich(1, REQ);

    expect(out.photos).toEqual([]);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('ENRICH-012: asks each source only for as many pictures as it may contribute', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      fetchGooglePhotoBytes: vi.fn(async () => Buffer.from([1])),
    });

    await make(maps, cacheStub()).enrich(1, REQ);

    expect(maps.fetchGooglePhotoRefs).toHaveBeenCalledWith('ChIJmuseum', 'key', 3);
    expect(maps.fetchCommonsCandidates).toHaveBeenCalledWith(REQ.lat, REQ.lng, 5);
  });

  it('ENRICH-012b: skips a Google reference whose media download comes back empty', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      fetchGooglePhotoRefs: vi.fn(async () => [
        { name: 'places/p/photos/gone', attribution: 'Bob' },
        { name: 'places/p/photos/ok', attribution: 'Cara' },
      ]),
      fetchGooglePhotoBytes: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(Buffer.from([1, 2, 3])),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(out.photos[0]).toMatchObject({ key: 'ChIJmuseum~p1', attribution: 'Cara' });
  });

  it('ENRICH-012c: downloads the pictures concurrently, not one after another', async () => {
    // Five sequential round trips plus five decodes pushed the request past the
    // client's timeout, which is what made the column show an error every time.
    let active = 0;
    let peak = 0;
    const maps = mapsStub({
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate(), commonsCandidate(), commonsCandidate()]),
    });
    mockSafeFetchFollow.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toHaveLength(3);
    expect(peak).toBeGreaterThan(1);
  });

  it('ENRICH-012d: asks both providers at the same time', async () => {
    const order: string[] = [];
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      fetchGooglePhotoRefs: vi.fn(async () => {
        order.push('google:start');
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push('google:end');
        return [];
      }),
      fetchCommonsCandidates: vi.fn(async () => {
        order.push('commons:start');
        return [];
      }),
    });

    await make(maps, cacheStub()).enrich(1, REQ);

    // Commons starts before Google finishes; the listings do not queue.
    expect(order.indexOf('commons:start')).toBeLessThan(order.indexOf('google:end'));
  });

  it('ENRICH-013: falls back to a coordinate pseudo-id when the place has none', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });

    const out = await make(maps, cacheStub()).enrich(1, { lat: 50.9, lng: 6.96, name: 'Bench' });

    expect(out.photos[0].key).toBe('coords:50.9:6.96~p0');
    expect(maps.fetchGooglePhotoRefs).not.toHaveBeenCalled();
  });
});

// ── Description ──────────────────────────────────────────────────────────────

describe('collectDescription', () => {
  it('ENRICH-014: prefers the OpenStreetMap description, which costs nothing', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({
        place: { summary: '  Ein Museum in Köln.  ', source: 'openstreetmap', osm_url: 'https://osm.org/way/1' },
      })),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(out.description).toEqual({
      text: 'Ein Museum in Köln.',
      source: 'osm',
      sourceUrl: 'https://osm.org/way/1',
      license: 'ODbL 1.0',
    });
    expect(maps.fetchEditorialSummary).not.toHaveBeenCalled();
    expect(maps.fetchWikiExtract).not.toHaveBeenCalled();
  });

  it('ENRICH-014b: leaves the OSM link empty when the details carry no osm_url', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { summary: 'Ein Museum.', source: 'openstreetmap' } })),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(out.description).toEqual({ text: 'Ein Museum.', source: 'osm', sourceUrl: null, license: 'ODbL 1.0' });
  });

  it('ENRICH-015: ignores a summary that came from Google on the OSM branch', async () => {
    // getPlaceDetails returns `summary` for Google places too; only the OSM one
    // is a mapper-written description we may label as such.
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { summary: 'Google blurb', source: 'google' } })),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.description).toBeNull();
  });

  it('ENRICH-016: uses Googles editorial summary when there is no OSM text', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: { google_maps_url: 'https://maps.google.com/x' } })),
      fetchEditorialSummary: vi.fn(async () => 'A museum in Cologne.'),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.description).toEqual({
      text: 'A museum in Cologne.',
      source: 'google',
      sourceUrl: 'https://maps.google.com/x',
      license: null,
    });
  });

  it('ENRICH-016b: leaves the source link empty when the details carry no Maps URL', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: null })),
      fetchEditorialSummary: vi.fn(async () => 'A museum in Cologne.'),
    });

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.description).toMatchObject({ source: 'google', sourceUrl: null });
  });

  it('ENRICH-018b: ignores a non-string wikipedia tag rather than passing it on', async () => {
    // Provider blobs are open records — a numeric or object tag must not reach
    // the wiki lookup as-is.
    const maps = mapsStub({ details: vi.fn(async () => ({ place: { wikipedia: 42 } })) });

    await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtract).toHaveBeenCalledWith(null);
  });

  it('ENRICH-017: honours the details kill switch and the missing key', async () => {
    const disabled = mapsStub({ getMapsKey: vi.fn(() => 'key'), detailsDisabled: vi.fn(() => true) });
    await make(disabled, cacheStub()).enrich(1, REQ);
    expect(disabled.fetchEditorialSummary).not.toHaveBeenCalled();

    const keyless = mapsStub({ getMapsKey: vi.fn(() => null) });
    await make(keyless, cacheStub()).enrich(1, REQ);
    expect(keyless.fetchEditorialSummary).not.toHaveBeenCalled();
  });

  it('ENRICH-018: falls back to Wikipedia, resolved from the wiki tag', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { wikipedia: 'de:Museum Ludwig' } })),
      fetchWikiExtract: vi.fn(async () => ({
        text: 'Das Museum Ludwig ist ein Museum.',
        sourceUrl: 'https://de.wikipedia.org/wiki/Museum%20Ludwig',
        source: 'wikipedia' as const,
      })),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtract).toHaveBeenCalledWith('de:Museum Ludwig');
    expect(out.description).toEqual({
      text: 'Das Museum Ludwig ist ein Museum.',
      source: 'wikipedia',
      sourceUrl: 'https://de.wikipedia.org/wiki/Museum%20Ludwig',
      license: 'CC BY-SA 4.0',
    });
  });

  it('ENRICH-019: passes null on when the place carries no wiki tag', async () => {
    const maps = mapsStub({ details: vi.fn(async () => ({ place: { name: 'Kiosk' } })) });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtract).toHaveBeenCalledWith(null);
    expect(out.description).toBeNull();
  });

  it('ENRICH-020: survives a details lookup that throws', async () => {
    const maps = mapsStub({ details: vi.fn(async () => { throw new Error('overpass down'); }) });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(out.description).toBeNull();
    expect(out.photos).toEqual([]);
  });
});

// ── Result cache ─────────────────────────────────────────────────────────────

describe('result cache', () => {
  // v is the cache format version; an entry written before a release that
  // changes the shape or the sources is discarded rather than served.
  const cachedRow = (photos: unknown[], fetchedAt = Date.now(), v: number | undefined = 2) => ({
    payload_json: JSON.stringify({ photos, description: null, facts: [], v }),
    fetched_at: fetchedAt,
  });

  it('ENRICH-021: serves a fresh entry without calling any provider', async () => {
    const maps = mapsStub();
    const cache = cacheStub({ get: vi.fn(() => ({ photoUrl: '/x', filePath: '/tmp/x', attribution: null })) });
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache')
        ? cachedRow([{ key: 'ChIJmuseum~p0', url: '/x', attribution: null, license: null, licenseUrl: null, sourceUrl: null, source: 'wikimedia' }])
        : undefined,
    );

    const out = await make(maps, cache).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(maps.fetchCommonsCandidates).not.toHaveBeenCalled();
  });

  it('ENRICH-022: refetches once the entry is older than a week', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache') ? cachedRow([], eightDaysAgo) : undefined,
    );

    await make(maps, cacheStub()).enrich(1, REQ);

    expect(maps.fetchCommonsCandidates).toHaveBeenCalled();
  });

  it('ENRICH-023: rebuilds when the nightly sweep removed a cached candidate', async () => {
    // The sweep deletes every picture nobody picked, so this is the normal state
    // of a cached entry the morning after. Serving the survivors would leave the
    // column empty for the rest of the week for a place that has pictures.
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    let onDisk = false;
    const cache = cacheStub({
      get: vi.fn(() => (onDisk ? { photoUrl: '/x', filePath: '/tmp/x', attribution: null } : null)),
      put: vi.fn(async (key: string) => {
        onDisk = true;
        return { photoUrl: `/api/maps/place-photo/${key}/bytes`, filePath: '/tmp/x', attribution: null };
      }),
    });
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache')
        ? cachedRow([{ key: 'ChIJmuseum~p0', url: '/x', attribution: null, license: null, licenseUrl: null, sourceUrl: null, source: 'wikimedia' }])
        : undefined,
    );

    const out = await make(maps, cache).enrich(1, REQ);

    expect(maps.fetchCommonsCandidates).toHaveBeenCalled();
    expect(out.photos).toHaveLength(1);
  });

  it('ENRICH-023b: keeps serving a cached entry while all its bytes are still there', async () => {
    const maps = mapsStub();
    const cache = cacheStub({ get: vi.fn(() => ({ photoUrl: '/x', filePath: '/tmp/x', attribution: null })) });
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache')
        ? cachedRow([{ key: 'ChIJmuseum~p0', url: '/x', attribution: null, license: null, licenseUrl: null, sourceUrl: null, source: 'wikimedia' }])
        : undefined,
    );

    const out = await make(maps, cache).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(maps.fetchCommonsCandidates).not.toHaveBeenCalled();
  });

  it('ENRICH-023c: discards an entry written by an older format version', async () => {
    // Otherwise a release that adds a field keeps serving last week's answers.
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache') ? cachedRow([], Date.now(), 1) : undefined,
    );

    await make(maps, cacheStub()).enrich(1, REQ);

    expect(maps.fetchCommonsCandidates).toHaveBeenCalled();
  });

  it('ENRICH-024: ignores an unreadable cache row and rebuilds', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    mockDbGet.mockImplementation((sql: string) =>
      String(sql).includes('place_details_cache') ? { payload_json: '{not json', fetched_at: Date.now() } : undefined,
    );

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
  });

  it('ENRICH-025: stores the result under its own cache kind and language', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });

    await make(maps, cacheStub()).enrich(1, { ...REQ, lang: 'de' });

    const write = mockDbRun.mock.calls.find((c) => String(c[0]).includes('INSERT OR REPLACE INTO place_details_cache'));
    expect(write).toBeDefined();
    expect(write![1]).toBe('ChIJmuseum');
    expect(write![2]).toBe('de');
    // expanded = 2 — the plain (0) and reviews (1) caches keep their rows.
    expect(write![3]).toBe(2);
  });

  it('ENRICH-026: keeps working when the cache write fails', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    mockDbRun.mockImplementation(() => { throw new Error('db locked'); });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const out = await make(maps, cacheStub()).enrich(1, REQ);

    expect(out.photos).toHaveLength(1);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

// ── Credit line ──────────────────────────────────────────────────────────────

describe('creditLine', () => {
  it('ENRICH-027: joins author and licence into the one text column the cache has', () => {
    expect(creditLine('Alice', 'CC BY-SA 4.0')).toBe('Alice · CC BY-SA 4.0');
    expect(creditLine('Alice', null)).toBe('Alice');
    expect(creditLine(null, 'CC BY-SA 4.0')).toBe('CC BY-SA 4.0');
    expect(creditLine(null, null)).toBeNull();
  });

  it('ENRICH-028: stores the joined credit alongside a Commons picture', async () => {
    const maps = mapsStub({ fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]) });
    const cache = cacheStub();

    await make(maps, cache).enrich(1, REQ);

    expect(cache.put).toHaveBeenCalledWith('ChIJmuseum~p0', expect.any(Buffer), 'Alice · CC BY-SA 4.0');
  });

  it('ENRICH-029: reads a stored credit back by cache key', () => {
    const cache = cacheStub({
      get: vi.fn((key: string) =>
        key === 'ChIJmuseum~p0' ? { photoUrl: '/x', filePath: '/tmp/x', attribution: 'Alice · CC BY-SA 4.0' } : null,
      ),
    });
    const svc = make(mapsStub(), cache);

    expect(svc.credit('ChIJmuseum~p0')).toEqual({ credit: 'Alice · CC BY-SA 4.0' });
    // An uploaded image or a key that was swept has nothing to name.
    expect(svc.credit('unknown')).toEqual({ credit: null });
  });
});

// ── OpenStreetMap facts (ENRICH-050..) ───────────────────────────────────────

describe('collectFacts', () => {
  const osm = (tags: Record<string, unknown>) => ({ source: 'openstreetmap', ...tags });

  it('ENRICH-050: turns the tags a restaurant actually carries into chips', () => {
    const facts = collectFacts(
      osm({
        cuisine: 'regional;german',
        opening_hours: ['Mo-Sa 17:30+'],
        menu_url: 'https://example.org/menu',
        outdoor_seating: 'yes',
        wheelchair: 'limited',
      }),
    );

    expect(facts).toEqual([
      // Hours come from the block shared with Google, so they lead.
      { kind: 'openingHours', value: 'Mo-Sa 17:30+', url: null },
      // Semicolons and underscores are OSM syntax, not something to show a reader.
      { kind: 'cuisine', value: 'regional, german', url: null },
      { kind: 'menu', value: null, url: 'https://example.org/menu' },
      { kind: 'outdoorSeating', value: null, url: null },
      { kind: 'wheelchair', value: 'limited', url: null },
    ]);
  });

  it('ENRICH-051: lists only positive facts', () => {
    // "No outdoor seating" is noise, and a missing tag reads the same to a user.
    const facts = collectFacts(
      osm({ outdoor_seating: 'no', takeaway: 'no', wheelchair: 'no', internet_access: 'no', diet_vegan: 'no' }),
    );
    expect(facts).toEqual([]);
  });

  it('ENRICH-052: accepts the "only" spelling for diets', () => {
    const kinds = collectFacts(osm({ diet_vegetarian: 'only', diet_vegan: 'yes' })).map((f) => f.kind);
    expect(kinds).toEqual(['vegetarian', 'vegan']);
  });

  it('ENRICH-052b: covers the remaining yes-tags and a non-string osm_url', () => {
    const facts = collectFacts(osm({ takeaway: 'yes', delivery: 'yes', internet_access: 'wlan', wheelchair: 'yes' }));
    expect(facts.map((f) => f.kind)).toEqual(['takeaway', 'delivery', 'wheelchair', 'internetAccess']);
    // Any internet_access value other than "no" counts as available.
    expect(facts.find((f) => f.kind === 'internetAccess')).toEqual({ kind: 'internetAccess', value: null, url: null });
  });

  it('ENRICH-053: takes the rating and hours from a Google place, but not its OSM-only tags', () => {
    expect(collectFacts(null)).toEqual([]);
    // cuisine/outdoor_seating are OSM tagging and never appear on a Google blob.
    expect(collectFacts({ source: 'google', cuisine: 'italian', outdoor_seating: 'yes' })).toEqual([]);
    expect(
      collectFacts({ source: 'google', rating: 4.5, rating_count: 1234, opening_hours: ['Mo-Fr 09:00-18:00'] }),
    ).toEqual([
      { kind: 'rating', value: '4.5 (1234)', url: null },
      { kind: 'openingHours', value: 'Mo-Fr 09:00-18:00', url: null },
    ]);
  });

  it('ENRICH-053b: omits the review count when there is none', () => {
    expect(collectFacts({ source: 'google', rating: 4 })).toEqual([{ kind: 'rating', value: '4', url: null }]);
  });

  it('ENRICH-054: joins multi-day opening hours into one readable line', () => {
    const facts = collectFacts(osm({ opening_hours: ['Mo-Fr 09:00-18:00', 'Sa 10:00-14:00'] }));
    expect(facts[0]).toEqual({ kind: 'openingHours', value: 'Mo-Fr 09:00-18:00 · Sa 10:00-14:00', url: null });
  });
});

describe('picture source selection', () => {
  it('ENRICH-055: prefers the Commons category over the coordinate search', async () => {
    // geosearch around a city centre returns statues and passers-by; the
    // category of a place returns the place.
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikimedia_commons: 'Category:Museum Ludwig' } })),
      fetchCommonsCategoryCandidates: vi.fn(async () => [commonsCandidate()]),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchCommonsCategoryCandidates).toHaveBeenCalledWith('Category:Museum Ludwig', 5);
    expect(maps.fetchCommonsCandidates).not.toHaveBeenCalled();
    expect(out.photos).toHaveLength(1);
  });

  it('ENRICH-056: falls back to the coordinate search when the category is empty', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikimedia_commons: 'Category:Empty' } })),
      fetchCommonsCategoryCandidates: vi.fn(async () => []),
      fetchCommonsCandidates: vi.fn(async () => [commonsCandidate()]),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(maps.fetchCommonsCandidates).toHaveBeenCalled();
    expect(out.photos).toHaveLength(1);
  });

  it('ENRICH-057: reports Wikivoyage as the description source when it answered', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikipedia: 'de:Berlin' } })),
      fetchWikiExtract: vi.fn(async () => ({
        text: 'Berlin ist das politische Zentrum Deutschlands.',
        sourceUrl: 'https://de.wikivoyage.org/wiki/Berlin',
        source: 'wikivoyage' as const,
      })),
    });

    const out = await make(maps, cacheStub()).enrich(1, OSM_REQ);

    expect(out.description).toMatchObject({ source: 'wikivoyage', license: 'CC BY-SA 4.0' });
  });
});
