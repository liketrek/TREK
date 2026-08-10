/**
 * ENRICH-090..096 — falling back to the chain a place belongs to.
 *
 * L'Osteria Rostock came back empty from every source: no Wikipedia article of
 * its own (a branch never has one), and Google holds no editorial summary for a
 * chain restaurant either — verified live, the call goes out and returns null.
 * The company does have an article, reachable through OSM's `brand:wikidata`.
 *
 * The rule that makes this safe: it may describe, it may not illustrate, and it
 * must say what it is describing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDbGet, mockDbRun } = vi.hoisted(() => ({
  // Declared with the shape the fake statement below calls it with (the SQL plus
  // whatever the caller bound), otherwise the spread has no rest parameter to land in.
  mockDbGet: vi.fn((_sql: string, ..._params: unknown[]): unknown => undefined),
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
import { readBrandIdentity } from '../../../src/nest/maps/maps.service';
import type { MapsService } from '../../../src/nest/maps/maps.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

const REQ = { lat: 54.088, lng: 12.1409, name: "L'Osteria Rostock", placeId: 'ChIJosteria', lang: 'de' };

/** The real Nominatim extratags for L'Osteria Rostock. */
const BRANCH_TAGS = {
  'brand:wikidata': 'Q17323478',
  'brand:wikipedia': 'de:L’Osteria',
  cuisine: 'pizza',
};

const CHAIN_EXTRACT = {
  text: 'L’Osteria ist eine deutsche Restaurantkette mit Schwerpunkt auf Pizza und Pasta.',
  sourceUrl: 'https://de.wikipedia.org/wiki/L%E2%80%99Osteria',
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
    fetchWikiExtract: vi.fn(async () => null as typeof CHAIN_EXTRACT | null),
    fetchWikiExtractFor: vi.fn(async () => null as typeof CHAIN_EXTRACT | null),
    fetchWikidataSitelinks: vi.fn(async () => ({}) as Record<string, string>),
    resolveOsmIdentity: vi.fn(async () => null as { tags: Record<string, string>; osmUrl: string | null; matchedName: string } | null),
    details: vi.fn(async () => ({ place: null })),
    ...over,
  } as unknown as MapsService;
}

const cacheStub = () =>
  ({ get: vi.fn(() => null), put: vi.fn(async () => ({ photoUrl: '/x', filePath: '/x', attribution: null })) }) as unknown as PlacePhotoCacheService;

const make = (maps: MapsService) => new PlaceEnrichmentService(new DatabaseService(db as never), maps, cacheStub());

/** A place whose own identity is empty but that belongs to a chain. */
const branchOfAChain = (over: Partial<Record<keyof MapsService, unknown>> = {}) =>
  mapsStub({
    resolveOsmIdentity: vi.fn(async () => ({ tags: BRANCH_TAGS, osmUrl: null, matchedName: "L'Osteria" })),
    ...over,
  });

beforeEach(() => {
  mockDbGet.mockReset();
  mockDbGet.mockReturnValue(undefined);
  mockDbRun.mockReset();
});

describe('readBrandIdentity', () => {
  it('ENRICH-090: reads the brand tags and nothing else', () => {
    expect(readBrandIdentity(BRANCH_TAGS)).toEqual({ wikidata: 'Q17323478', wikipedia: 'de:L’Osteria' });
    expect(readBrandIdentity({ wikidata: 'Q1' })).toEqual({ wikidata: null, wikipedia: null });
    expect(readBrandIdentity(null)).toEqual({ wikidata: null, wikipedia: null });
  });
});

describe('chain fallback', () => {
  it('ENRICH-091: describes the chain when nothing describes the place', async () => {
    const maps = branchOfAChain({
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'L’Osteria' })),
      fetchWikiExtractFor: vi.fn(async () => CHAIN_EXTRACT),
    });

    const out = await make(maps).enrich(1, REQ);

    expect(out.description).toMatchObject({ text: CHAIN_EXTRACT.text, aboutBrand: true, license: 'CC BY-SA 4.0' });
    expect(maps.fetchWikidataSitelinks).toHaveBeenCalledWith('Q17323478', expect.any(Array));
  });

  it('ENRICH-092: never lets the chain illustrate the place', async () => {
    // A chain's logo passed off as a photo of this restaurant is a plain lie,
    // so the picture ladder does not read the brand tags at all.
    const maps = branchOfAChain({
      fetchWikidataCandidates: vi.fn(async () => ({ candidates: [], commonsCategory: null })),
      fetchWikiExtractFor: vi.fn(async () => CHAIN_EXTRACT),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'L’Osteria' })),
    });

    await make(maps).enrich(1, REQ);

    // Called with nothing, or not at all — but never with the brand's Q-id.
    for (const call of (maps.fetchWikidataCandidates as unknown as { mock: { calls: unknown[][] } }).mock.calls) {
      expect(call[0]).not.toBe('Q17323478');
    }
  });

  it('ENRICH-093: marks the text so the column can head it differently', async () => {
    const maps = branchOfAChain({
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'L’Osteria' })),
      fetchWikiExtractFor: vi.fn(async () => CHAIN_EXTRACT),
    });

    const out = await make(maps).enrich(1, REQ);

    // Without this flag the reader has no way to tell that "a German restaurant
    // chain" is about the company and not about the branch they are adding.
    expect(out.description?.aboutBrand).toBe(true);
  });

  it('ENRICH-094: a place with its own article never reaches the chain', async () => {
    const OWN = { ...CHAIN_EXTRACT, text: 'Das Museum Ludwig zeigt moderne Kunst.' };
    const maps = mapsStub({
      details: vi.fn(async () => ({ place: { source: 'openstreetmap', wikidata: 'Q1' } })),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'Museum Ludwig' })),
      fetchWikiExtractFor: vi.fn(async () => OWN),
    });

    const out = await make(maps).enrich(1, REQ);

    expect(out.description).toMatchObject({ text: OWN.text });
    expect(out.description?.aboutBrand).toBeUndefined();
  });

  it('ENRICH-095: Google still wins over the chain', async () => {
    // Google describes THIS branch; the chain article does not.
    const maps = branchOfAChain({
      getMapsKey: vi.fn(() => 'key'),
      fetchEditorialSummary: vi.fn(async () => 'Casual chain spot for wood-fired pizza.'),
      fetchWikidataSitelinks: vi.fn(async () => ({ dewiki: 'L’Osteria' })),
      fetchWikiExtractFor: vi.fn(async () => CHAIN_EXTRACT),
    });

    const out = await make(maps).enrich(1, REQ);

    expect(out.description).toMatchObject({ source: 'google', text: 'Casual chain spot for wood-fired pizza.' });
    expect(out.description?.aboutBrand).toBeUndefined();
  });

  it('ENRICH-096: a place with no brand tag still ends with no description', async () => {
    const maps = mapsStub({
      resolveOsmIdentity: vi.fn(async () => ({ tags: { cuisine: 'pizza' }, osmUrl: null, matchedName: 'Kiosk' })),
    });

    const out = await make(maps).enrich(1, REQ);

    expect(out.description).toBeNull();
  });
});
