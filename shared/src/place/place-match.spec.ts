import { COORD_DEDUP_TOLERANCE, externalIdsOf, normalizePlaceName, placeMatchStrategies } from './place-match';

import { describe, it, expect } from 'vitest';

describe('normalizePlaceName', () => {
  it('trims and lowercases', () => {
    expect(normalizePlaceName('  Eiffel Tower ')).toBe('eiffel tower');
  });

  it('treats blank, whitespace, null and undefined alike as no name', () => {
    expect(normalizePlaceName('')).toBeNull();
    expect(normalizePlaceName('   ')).toBeNull();
    expect(normalizePlaceName(null)).toBeNull();
    expect(normalizePlaceName(undefined)).toBeNull();
  });
});

describe('externalIdsOf', () => {
  it('collects the provider ids that carry a value, trimmed', () => {
    expect(externalIdsOf({ google_place_id: ' ChIJ_a ', google_ftid: '0x1:0x2', osm_id: null })).toEqual([
      'ChIJ_a',
      '0x1:0x2',
    ]);
  });

  it('ignores blank ids', () => {
    expect(externalIdsOf({ google_ftid: '  ', osm_id: '' })).toEqual([]);
  });

  it('keeps provider order: place_id, ftid, osm', () => {
    expect(externalIdsOf({ osm_id: 'node/42', google_ftid: 'f', google_place_id: 'p' })).toEqual(['p', 'f', 'node/42']);
  });
});

describe('placeMatchStrategies', () => {
  it('puts every provider id first, one strategy each, in provider order', () => {
    expect(placeMatchStrategies({ name: 'Trattoria', google_place_id: 'p', osm_id: 'node/42' })).toEqual([
      { by: 'externalId', id: 'p' },
      { by: 'externalId', id: 'node/42' },
      { by: 'name', name: 'trattoria' },
    ]);
  });

  it('never offers coordinates for a NAMED candidate, even when it has them', () => {
    // The whole point of the rule: widening the coordinate check to named places
    // would merge the restaurant and the bar in the same building.
    const strategies = placeMatchStrategies({ name: 'Ground Floor Diner', lat: 52.52, lng: 13.405 });

    expect(strategies).toEqual([{ by: 'name', name: 'ground floor diner' }]);
    expect(strategies.some((s) => s.by === 'coords')).toBe(false);
  });

  it('falls back to coordinates only when there is no name', () => {
    expect(placeMatchStrategies({ name: null, lat: 48.85, lng: 2.35 })).toEqual([
      { by: 'coords', lat: 48.85, lng: 2.35, tolerance: COORD_DEDUP_TOLERANCE },
    ]);
  });

  it('offers provider ids then coordinates for an unnamed candidate that has both', () => {
    expect(placeMatchStrategies({ name: '  ', google_ftid: 'f', lat: 1, lng: 2 })).toEqual([
      { by: 'externalId', id: 'f' },
      { by: 'coords', lat: 1, lng: 2, tolerance: COORD_DEDUP_TOLERANCE },
    ]);
  });

  it('offers nothing for a candidate with no name, no ids and no coordinates', () => {
    expect(placeMatchStrategies({ name: null, lat: null, lng: null })).toEqual([]);
  });

  it('needs both halves of a coordinate pair', () => {
    expect(placeMatchStrategies({ name: null, lat: 48.85, lng: null })).toEqual([]);
    expect(placeMatchStrategies({ name: null, lat: null, lng: 2.35 })).toEqual([]);
  });
});
