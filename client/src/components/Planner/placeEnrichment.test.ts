// FE-PLANNER-ENRICHCACHE-001 to FE-PLANNER-ENRICHCACHE-005: the session cache the editor's
// details column and the view's photo gallery share, so a place is asked about once.
import type { MapsPlaceEnrichmentResult } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __clearEnrichmentCacheForTests,
  cacheKeyFor,
  readCachedEnrichment,
  storeEnrichment,
  type PlaceDetailsSelection,
} from './placeEnrichment';

const SELECTION: PlaceDetailsSelection = { placeId: 'way:1', lat: 50.9, lng: 6.96, name: 'Museum Ludwig' };
const RESULT = { photos: [], facts: [], description: null } as unknown as MapsPlaceEnrichmentResult;

beforeEach(() => {
  sessionStorage.clear();
  __clearEnrichmentCacheForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('placeEnrichment', () => {
  it('FE-PLANNER-ENRICHCACHE-001: the key names the version, the place (or its coordinates) and the language', () => {
    expect(cacheKeyFor(SELECTION, 'de')).toBe('enrich_v4_way:1_de');
    expect(cacheKeyFor({ lat: 1.5, lng: 2, name: 'Pin' }, 'en')).toBe('enrich_v4_coords:1.5:2_en');
  });

  it('FE-PLANNER-ENRICHCACHE-002: nothing is cached before it is stored, then both caches hold it', () => {
    expect(readCachedEnrichment(SELECTION, 'de')).toBeUndefined();
    storeEnrichment(SELECTION, 'de', RESULT);
    expect(readCachedEnrichment(SELECTION, 'de')).toBe(RESULT);
    expect(JSON.parse(sessionStorage.getItem('enrich_v4_way:1_de') ?? '')).toEqual(RESULT);
    // Another language is another answer.
    expect(readCachedEnrichment(SELECTION, 'en')).toBeUndefined();
  });

  it('FE-PLANNER-ENRICHCACHE-003: an answer kept in the session outlives the in-memory cache', () => {
    storeEnrichment(SELECTION, 'de', RESULT);
    __clearEnrichmentCacheForTests();
    expect(readCachedEnrichment(SELECTION, 'de')).toEqual(RESULT);
    // Taken back into memory: the session is not read a second time.
    sessionStorage.clear();
    expect(readCachedEnrichment(SELECTION, 'de')).toEqual(RESULT);
  });

  it('FE-PLANNER-ENRICHCACHE-004: a broken session entry reads as nothing cached', () => {
    sessionStorage.setItem(cacheKeyFor(SELECTION, 'de'), '{not json');
    expect(readCachedEnrichment(SELECTION, 'de')).toBeUndefined();
  });

  it('FE-PLANNER-ENRICHCACHE-005: a full or blocked session storage still keeps the answer in memory', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => storeEnrichment(SELECTION, 'de', RESULT)).not.toThrow();
    expect(readCachedEnrichment(SELECTION, 'de')).toBe(RESULT);
  });
});
