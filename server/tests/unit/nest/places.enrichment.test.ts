/**
 * Unit tests for the import-enrichment match selector (#886).
 * Covers PENRICH-001 to PENRICH-004 — the coordinate-validation guard that
 * prevents a name search from overwriting an imported place with the wrong POI.
 *
 * Moved from tests/unit/services/placeEnrichment.test.ts when the helper folded
 * into the places domain: the selector is pure, so it now lives in
 * places.helpers.ts and needs no DB/websocket/Maps stubbing at all.
 */
import { describe, it, expect } from 'vitest';

import { pickEnrichmentMatch } from '../../../src/nest/places/places.helpers';

const target = { lat: 48.85, lng: 2.35 };

describe('pickEnrichmentMatch', () => {
  it('PENRICH-001: picks the closest Google candidate within the radius', () => {
    const candidates = [
      { google_place_id: 'far', lat: 48.8512, lng: 2.3512 }, // ~170 m
      { google_place_id: 'near', lat: 48.85, lng: 2.35 }, // exact
    ];
    const match = pickEnrichmentMatch(candidates, target);
    expect(match?.google_place_id).toBe('near');
  });

  it('PENRICH-002: returns null when every candidate is beyond the radius', () => {
    const candidates = [{ google_place_id: 'A', lat: 48.86, lng: 2.36 }]; // ~1.2 km
    expect(pickEnrichmentMatch(candidates, target)).toBeNull();
  });

  it('PENRICH-003: ignores candidates without a google_place_id (e.g. OSM results)', () => {
    const candidates = [
      { google_place_id: null, lat: 48.85, lng: 2.35 },
      { name: 'no id', lat: 48.85, lng: 2.35 },
    ];
    expect(pickEnrichmentMatch(candidates, target)).toBeNull();
  });

  it('PENRICH-004: ignores candidates with non-numeric coordinates', () => {
    const candidates = [{ google_place_id: 'A', lat: 'x', lng: 'y' }];
    expect(pickEnrichmentMatch(candidates as never, target)).toBeNull();
  });
});
