/**
 * ENRICH-070..082 — where a description comes from.
 *
 * The cases the column got wrong on dev1: L'Osteria Rostock, Hamburg Airport
 * and Berlin Brandenburg Airport all showed no description at all with a Google
 * key configured, and Berlin Hauptbahnhof showed none without one. Two distinct
 * causes, both pinned here — Google short-circuiting the free chain, and the
 * chain itself only ever starting from an OSM `wikipedia` tag.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbGet, mockDbRun } = vi.hoisted(() => ({
  mockDbGet: vi.fn(() => undefined as any),
  mockDbRun: vi.fn(),
}));

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
  safeFetchFollow: vi.fn(async () => ({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) })),
  checkSsrf: vi.fn(async () => ({ allowed: true })),
  SsrfBlockedError: class extends Error {},
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PlaceEnrichmentService } from '../../../src/nest/place-enrichment/place-enrichment.service';
import type { MapsService } from '../../../src/nest/maps/maps.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

const GOOGLE_REQ = { lat: 53.6323, lng: 10.0067, name: 'Hamburg Airport', placeId: 'ChIJham', lang: 'de' };
const OSM_REQ = { lat: 52.525, lng: 13.3694, name: 'Berlin Hauptbahnhof', placeId: 'relation:3600565', lang: 'de' };

const EXTRACT = {
  text: 'Der Berliner Hauptbahnhof ist der größte Kreuzungsbahnhof Europas.',
  sourceUrl: 'https://de.wikipedia.org/wiki/Berlin_Hauptbahnhof',
  source: 'wikipedia' as const,
};

function mapsStub(over: Partial<Record<keyof MapsService, unknown>> = {}) {
  return {
    getMapsKey: vi.fn(() => null as string | null),
    photosDisabled: vi.fn(() => false),
    detailsDisabled: vi.fn(() => false),
    fetchGooglePhotoRefs: vi.fn(async () => []),
    fetchGooglePhotoBytes: vi.fn(async () => null),
    fetchCommonsCandidates: vi.fn(async () => []),
    fetchCommonsCategoryCandidates: vi.fn(async () => []),
    fetchWikidataCandidates: vi.fn(async () => ({ candidates: [], commonsCategory: null })),
    fetchCommonsFilesByName: vi.fn(async () => new Map()),
    fetchWikiLeadImageName: vi.fn(async () => null),
    fetchEditorialSummary: vi.fn(async () => null as string | null),
    fetchWikiExtract: vi.fn(async () => null as typeof EXTRACT | null),
    fetchWikiExtractFor: vi.fn(async () => null as typeof EXTRACT | null),
    fetchWikidataSitelinks: vi.fn(async () => ({}) as Record<string, string>),
    resolveOsmIdentity: vi.fn(async () => null as { tags: Record<string, string>; osmUrl: string | null; matchedName: string } | null),
    details: vi.fn(async () => ({ place: null })),
    ...over,
  } as unknown as MapsService;
}

const cacheStub = () =>
  ({ get: vi.fn(() => null), put: vi.fn(async () => ({ photoUrl: '/x', filePath: '/x', attribution: null })) }) as unknown as PlacePhotoCacheService;

const make = (maps: MapsService) => new PlaceEnrichmentService(new DatabaseService(db as never), maps, cacheStub());

beforeEach(() => {
  mockDbGet.mockReset();
  mockDbGet.mockReturnValue(undefined);
  mockDbRun.mockReset();
});

describe('identity resolution', () => {
  it('ENRICH-070: looks up a Google place in OpenStreetMap, which is where its wiki tags live', async () => {
    // Google's payload has no wikidata, no wikipedia and no wikimedia_commons —
    // it never had. Before this, configuring an API key silently switched off
    // the free half of the column.
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: { source: 'google', name: 'Hamburg Airport' } })),
      resolveOsmIdentity: vi.fn(async () => ({
        tags: { wikidata: 'Q27706', wikipedia: 'de:Flughafen Hamburg' },
        osmUrl: 'https://www.openstreetmap.org/way/147122729',
        matchedName: 'Hamburg Airport',
      })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewikivoyage: 'Hamburg-Fuhlsbüttel' })),
      fetchWikiExtractFor: vi.fn(async () => ({ ...EXTRACT, source: 'wikivoyage' as const })),
    });

    const out = await make(maps).enrich(1, GOOGLE_REQ);

    expect(maps.resolveOsmIdentity).toHaveBeenCalledWith('Hamburg Airport', 53.6323, 10.0067, { lang: 'de' });
    expect(out.description).toMatchObject({ source: 'wikivoyage', license: 'CC BY-SA 4.0' });
  });

  it('ENRICH-071: does not spend a lookup when the payload already carries tags', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikidata: 'Q1097' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'Berlin Hauptbahnhof' })),
      fetchWikiExtractFor: vi.fn(async () => EXTRACT),
    });

    await make(maps).enrich(1, OSM_REQ);

    expect(maps.resolveOsmIdentity).not.toHaveBeenCalled();
  });

  it('ENRICH-072: keeps OSM tags out of a Google payload', async () => {
    // collectFacts and the OSM branch of collectDescription both gate on
    // details.source. Merging the looked-up tags in would either be dead weight
    // or would make a Google place claim to be an OpenStreetMap one.
    const details = { source: 'google', name: 'Hamburg Airport', summary: null };
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: details })),
      resolveOsmIdentity: vi.fn(async () => ({
        tags: { wikidata: 'Q27706', cuisine: 'german' },
        osmUrl: null,
        matchedName: 'Hamburg Airport',
      })),
    });

    const out = await make(maps).enrich(1, GOOGLE_REQ);

    expect(details).toEqual({ source: 'google', name: 'Hamburg Airport', summary: null });
    // Cuisine is an OSM fact and this is a Google place, so it stays out.
    expect(out.facts.some((f) => f.kind === 'cuisine')).toBe(false);
  });
});

describe('description source order', () => {
  it('ENRICH-073: prefers a free article over Google, even with a key configured', async () => {
    // This is the whole point of the reordering: Google used to be asked first
    // and answered for almost nothing, so the column stayed empty while a
    // perfectly good article sat one call away.
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: { source: 'google', wikidata: 'Q1097' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'Berlin Hauptbahnhof' })),
      fetchWikiExtractFor: vi.fn(async () => EXTRACT),
      fetchEditorialSummary: vi.fn(async () => 'A large railway station.'),
    });

    const out = await make(maps).enrich(1, { ...OSM_REQ, placeId: 'ChIJhbf' });

    expect(out.description).toMatchObject({ source: 'wikipedia' });
    // Not merely lower priority — the billed call is never made.
    expect(maps.fetchEditorialSummary).not.toHaveBeenCalled();
  });

  it('ENRICH-074: still falls back to Google when nothing free describes the place', async () => {
    const maps = mapsStub({
      getMapsKey: vi.fn(() => 'key'),
      details: vi.fn(async () => ({ place: { source: 'google', google_maps_url: 'https://maps.google/x' } })),
      fetchEditorialSummary: vi.fn(async () => 'Casual chain for wood-fired pizza.'),
    });

    const out = await make(maps).enrich(1, { ...GOOGLE_REQ, name: "L'Osteria Rostock" });

    expect(out.description).toMatchObject({
      source: 'google',
      text: 'Casual chain for wood-fired pizza.',
      sourceUrl: 'https://maps.google/x',
      license: null,
    });
  });

  it('ENRICH-075: keeps the OpenStreetMap description ahead of everything', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({
        place: { source: 'openstreetmap', summary: '  Ein Bahnhof.  ', osm_url: 'https://osm.org/r/1', wikidata: 'Q1097' },
      })),
      fetchWikiExtractFor: vi.fn(async () => EXTRACT),
    });

    const out = await make(maps).enrich(1, OSM_REQ);

    expect(out.description).toMatchObject({ text: 'Ein Bahnhof.', source: 'osm', license: 'ODbL 1.0' });
    expect(maps.fetchWikidataSitelinks).not.toHaveBeenCalled();
  });
});

describe('article language choice', () => {
  it('ENRICH-076: asks for the reader\'s language before English', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikidata: 'Q1097' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'Berlin Hauptbahnhof', enwiki: 'Berlin Hauptbahnhof' })),
      fetchWikiExtractFor: vi.fn(async () => EXTRACT),
    });

    await make(maps).enrich(1, OSM_REQ);

    const sites = (maps.fetchWikidataSitelinks as unknown as { mock: { calls: [string, string[]][] } }).mock.calls[0][1];
    expect(sites.slice(0, 2)).toEqual(['dewikivoyage', 'dewiki']);
    expect(sites).toContain('enwiki');
    expect(maps.fetchWikiExtractFor).toHaveBeenCalledWith('wikipedia', 'de', 'Berlin Hauptbahnhof');
  });

  it('ENRICH-077: puts Wikivoyage ahead of Wikipedia in the same language', async () => {
    // Wikivoyage describes a place for somebody about to go there; Wikipedia
    // opens with area in square kilometres.
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikidata: 'Q1097' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewikivoyage: 'Berlin', dewiki: 'Berlin Hauptbahnhof' })),
      fetchWikiExtractFor: vi.fn(async () => ({ ...EXTRACT, source: 'wikivoyage' as const })),
    });

    await make(maps).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtractFor).toHaveBeenNthCalledWith(1, 'wikivoyage', 'de', 'Berlin');
  });

  it('ENRICH-078: keeps the language the place itself named, ahead of English', async () => {
    // A Korean reader looking at the Brandenburg Gate: no kowiki sitelink, but
    // the OSM tag names a German article somebody curated for this place.
    const maps = mapsStub({
      details: vi.fn(async () => ({
        place: { source: 'openstreetmap', wikidata: 'Q82425', wikipedia: 'de:Brandenburger Tor' },
      })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'Brandenburger Tor', enwiki: 'Brandenburg Gate' })),
      fetchWikiExtractFor: vi.fn(async () => EXTRACT),
    });

    await make(maps).enrich(1, { ...OSM_REQ, lang: 'ko' });

    const sites = (maps.fetchWikidataSitelinks as unknown as { mock: { calls: [string, string[]][] } }).mock.calls[0][1];
    expect(sites.indexOf('dewiki')).toBeLessThan(sites.indexOf('enwiki'));
  });

  it('ENRICH-079: falls back to the tag when the item has no usable sitelink', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({
        place: { source: 'openstreetmap', wikidata: 'Q1', wikipedia: 'de:Museum Ludwig' },
      })),
      fetchWikidataSitelinks: vi.fn(async () => ({})),
      fetchWikiExtract: vi.fn(async () => EXTRACT),
    });

    const out = await make(maps).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtract).toHaveBeenCalledWith('de:Museum Ludwig');
    expect(out.description).toMatchObject({ source: 'wikipedia' });
  });

  it('ENRICH-080: tries the next site when one has no article', async () => {
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikidata: 'Q1097' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewikivoyage: 'Nowhere', dewiki: 'Berlin Hauptbahnhof' })),
      fetchWikiExtractFor: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(EXTRACT),
    });

    const out = await make(maps).enrich(1, OSM_REQ);

    expect(maps.fetchWikiExtractFor).toHaveBeenCalledTimes(2);
    expect(out.description).toMatchObject({ source: 'wikipedia' });
  });
});
