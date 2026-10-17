/**
 * Unit tests for the pure places helpers: the import dedup predicates and the
 * enrichment plumbing. The KMZ unpacker and the Google list id parsing moved
 * with their code to place-import/ (kml.codec.test.ts, google-list.provider.test.ts).
 */
import {
  COORD_DEDUP_TOLERANCE,
  externalIdsOf,
  isPlaceDuplicate,
  mapWithConcurrency,
  trackInsertedInDedupSet,
  trimOrNull,
  type DedupSet,
} from '../../../src/nest/places/places.helpers';

import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/db/database', () => ({
  db: { prepare: vi.fn() },
  getPlaceWithTags: vi.fn(),
}));

// ── Import dedup predicates ───────────────────────────────────────────────────

const emptyDedup = (): DedupSet => ({ names: new Set(), coords: [], externalIds: new Set() });

describe('isPlaceDuplicate / trackInsertedInDedupSet', () => {
  it('matches a named place case- and whitespace-insensitively', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: '  Eiffel Tower ', lat: 1, lng: 2 }, dedup);
    expect(isPlaceDuplicate({ name: 'eiffel tower', lat: null, lng: null }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: 'Louvre', lat: null, lng: null }, dedup)).toBe(false);
  });

  it('falls back to coordinate proximity for unnamed places', () => {
    const dedup = emptyDedup();
    // No name — tracked by coordinates instead.
    trackInsertedInDedupSet({ name: null, lat: 48.85, lng: 2.35 }, dedup);
    expect(dedup.names.size).toBe(0);
    expect(isPlaceDuplicate({ name: undefined, lat: 48.85 + COORD_DEDUP_TOLERANCE / 2, lng: 2.35 }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: undefined, lat: 48.9, lng: 2.35 }, dedup)).toBe(false);
  });

  it('a named candidate never falls through to the coordinate check', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: null, lat: 48.85, lng: 2.35 }, dedup);
    // Same spot, but it carries a name — name lookup misses, so it is not a dup.
    expect(isPlaceDuplicate({ name: 'Named', lat: 48.85, lng: 2.35 }, dedup)).toBe(false);
  });

  it('a candidate with neither a name nor coordinates is never a duplicate', () => {
    expect(isPlaceDuplicate({ name: null, lat: null, lng: null }, emptyDedup())).toBe(false);
  });

  // #1550 — the reported bug: rename an imported place, re-import the list, get a twin.
  it('recognises a renamed place by its provider id', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: 'Trattoria da Enzo', lat: 41.88, lng: 12.47, google_ftid: '0x1:0x2' }, dedup);
    // The user renamed it in TREK; the list still calls it what Google calls it.
    dedup.names.delete('trattoria da enzo');
    dedup.names.add('dinner tuesday');
    expect(isPlaceDuplicate({ name: 'Trattoria da Enzo', lat: 41.88, lng: 12.47, google_ftid: '0x1:0x2' }, dedup)).toBe(
      true,
    );
  });

  it('matches on any of the three id columns, and ignores blank ones', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: 'A', lat: null, lng: null, google_place_id: 'ChIJ_a' }, dedup);
    trackInsertedInDedupSet({ name: 'B', lat: null, lng: null, osm_id: 'node/42' }, dedup);
    expect(isPlaceDuplicate({ name: 'renamed', lat: null, lng: null, google_place_id: 'ChIJ_a' }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: 'renamed', lat: null, lng: null, osm_id: 'node/42' }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: 'renamed', lat: null, lng: null, google_ftid: '  ' }, dedup)).toBe(false);
  });

  it('keeps two different places in the same building apart', () => {
    const dedup = emptyDedup();
    // Identical coordinates, different ids: the restaurant and the bar downstairs.
    trackInsertedInDedupSet({ name: 'Rooftop Bar', lat: 52.52, lng: 13.405, google_ftid: '0xaa:0xbb' }, dedup);
    expect(
      isPlaceDuplicate({ name: 'Ground Floor Diner', lat: 52.52, lng: 13.405, google_ftid: '0xcc:0xdd' }, dedup),
    ).toBe(false);
  });

  it('leaves id-less imports on their old behaviour', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: 'Colosseum', lat: 41.89, lng: 12.49 }, dedup);
    expect(dedup.externalIds.size).toBe(0);
    expect(isPlaceDuplicate({ name: 'colosseum', lat: null, lng: null }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: 'Colosseum renamed', lat: 41.89, lng: 12.49 }, dedup)).toBe(false);
  });

  it('externalIdsOf trims and drops empties', () => {
    expect(externalIdsOf({ google_place_id: ' ChIJ ', google_ftid: '', osm_id: null })).toEqual(['ChIJ']);
    expect(externalIdsOf({})).toEqual([]);
  });
});

// ── Enrichment plumbing ───────────────────────────────────────────────────────

describe('mapWithConcurrency / trimOrNull', () => {
  it('visits every item and never runs more than `limit` at once', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const seen: number[] = [];
    let inFlight = 0;
    let peak = 0;
    await mapWithConcurrency(items, 3, async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      seen.push(n);
      inFlight -= 1;
    });
    expect(seen.sort((a, b) => a - b)).toEqual(items);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('is a no-op for an empty list', async () => {
    const fn = vi.fn();
    await mapWithConcurrency([], 3, fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('trimOrNull keeps real strings and nulls everything else', () => {
    expect(trimOrNull('  Paris ')).toBe('Paris');
    expect(trimOrNull('   ')).toBeNull();
    expect(trimOrNull(42)).toBeNull();
    expect(trimOrNull(undefined)).toBeNull();
  });
});
