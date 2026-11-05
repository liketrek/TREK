/**
 * Unit tests for the pure places helpers: the import dedup predicates and the
 * enrichment plumbing. The KMZ unpacker and the Google list id parsing moved
 * with their code to place-import/ (kml.codec.test.ts, google-list.provider.test.ts).
 */
import {
  COORD_DEDUP_TOLERANCE,
  dedupSetOf,
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
  it('matches a track only against the tracks of that name, never a sight of that name (#2810)', () => {
    // The watch named the hike after the gorge, and the gorge is already a place of the trip.
    const dedup = dedupSetOf([
      { name: 'Hokitika Gorge', lat: -42.95, lng: 171.0, route_geometry: null },
      { name: ' 008 ', lat: 1, lng: 2, route_geometry: '[[1,2],[3,4]]' },
    ]);
    expect(isPlaceDuplicate({ name: 'hokitika gorge', lat: -42.9, lng: 171.0, track: true }, dedup)).toBe(false);
    expect(isPlaceDuplicate({ name: '008', lat: 1, lng: 2, track: true, routeGeometry: '[[1,2],[3,4]]' }, dedup)).toBe(
      true,
    );
    // A pin still matches every place of its name, a track included.
    expect(isPlaceDuplicate({ name: 'Hokitika Gorge', lat: null, lng: null }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: '008', lat: null, lng: null }, dedup)).toBe(true);

    // A track imported earlier in the same file counts for the next one.
    trackInsertedInDedupSet({ name: 'Hokitika Gorge', lat: -42.9, lng: 171.0, track: true }, dedup);
    expect(isPlaceDuplicate({ name: 'Hokitika gorge ', lat: null, lng: null, track: true }, dedup)).toBe(true);
    // A set built by hand without tracks matches no track by name.
    const bare = emptyDedup();
    trackInsertedInDedupSet({ name: 'Ridge', lat: 1, lng: 2 }, bare);
    expect(isPlaceDuplicate({ name: 'Ridge', lat: 1, lng: 2, track: true }, bare)).toBe(false);
    trackInsertedInDedupSet({ name: 'Lake', lat: 1, lng: 2, track: true }, bare);
    expect([...(bare.tracks ?? [])]).toEqual(['lake\u0000']);
  });

  it('keeps two tracks of one name apart when they run differently (#2870)', () => {
    // Two watch hikes, both called "Afternoon Hike": one up the valley, one along the coast.
    const valley = '[[46.5,8.0,1200],[46.52,8.03,1500],[46.55,8.06,1900]]';
    const coast = '[[43.7,7.25],[43.72,7.3],[43.74,7.35]]';
    const dedup = dedupSetOf([{ name: 'Afternoon Hike', lat: 46.5, lng: 8.0, route_geometry: valley }]);
    expect(
      isPlaceDuplicate({ name: 'afternoon hike', lat: 43.7, lng: 7.25, track: true, routeGeometry: coast }, dedup),
    ).toBe(false);
    // The same file again is still the same track, its points rounded or thinned as they may be.
    const valleyAgain = '[[46.50001,8.00002],[46.55,8.06]]';
    expect(
      isPlaceDuplicate({ name: 'Afternoon Hike', lat: 46.5, lng: 8.0, track: true, routeGeometry: valleyAgain }, dedup),
    ).toBe(true);

    // Within one file: the first of the two goes in, the second is not taken for it.
    const batch = emptyDedup();
    const first = { name: 'Day 1', lat: 46.5, lng: 8.0, track: true, routeGeometry: valley };
    const second = { name: 'Day 1', lat: 43.7, lng: 7.25, track: true, routeGeometry: coast };
    expect(isPlaceDuplicate(first, batch)).toBe(false);
    trackInsertedInDedupSet(first, batch);
    expect(isPlaceDuplicate(second, batch)).toBe(false);
    trackInsertedInDedupSet(second, batch);
    expect(isPlaceDuplicate({ ...second }, batch)).toBe(true);

    // A line that does not parse falls back to the name alone, on both sides.
    const broken = dedupSetOf([{ name: 'Loop', lat: 1, lng: 2, route_geometry: 'not json' }]);
    expect(isPlaceDuplicate({ name: 'Loop', lat: 1, lng: 2, track: true, routeGeometry: '{}' }, broken)).toBe(true);
    expect(isPlaceDuplicate({ name: 'Loop', lat: 1, lng: 2, track: true, routeGeometry: coast }, broken)).toBe(false);
  });

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
