// FE-PLANNER-ORIGINS-001 to FE-PLANNER-ORIGINS-005: where the place form's shareable fields
// got their values, as the save reports it in fieldOrigins.
import { describe, expect, it } from 'vitest';

import { DEFAULT_FORM, mergeResult, type ResultField } from './PlaceFormModal.helpers';
import { originsAfterPick, resultOrigin, withOrigin } from './placeFieldOrigins';

describe('placeFieldOrigins', () => {
  it('FE-PLANNER-ORIGINS-001: names the provider a result came from by the ids it carries', () => {
    expect(resultOrigin({ osm_id: 'gers:abc' })).toBe('trek');
    expect(resultOrigin({ source: 'trek-places' })).toBe('trek');
    expect(resultOrigin({ amap_poi_id: 'amap:B1' })).toBe('amap');
    expect(resultOrigin({ google_place_id: 'ChIJ1', osm_id: 'node:1' })).toBe('google');
    expect(resultOrigin({ osm_id: 'way:2' })).toBe('osm');
    expect(resultOrigin({ name: 'Pin' })).toBe('enrichment');
  });

  it('FE-PLANNER-ORIGINS-002: sets and forgets one shareable field, the picture under its own name', () => {
    expect(withOrigin(undefined, 'website', 'user')).toEqual({ website: 'user' });
    expect(withOrigin({ website: 'user' }, 'image_url', 'enrichment')).toEqual({
      website: 'user',
      image: 'enrichment',
    });
    expect(withOrigin({ website: 'user', image: 'enrichment' }, 'image_url', null)).toEqual({ website: 'user' });
  });

  it('FE-PLANNER-ORIGINS-003: a field that is not shared leaves the origins as they were', () => {
    const origins = { phone: 'user' as const };
    expect(withOrigin(origins, 'name', 'user')).toBe(origins);
    expect(withOrigin(undefined, 'notes', 'user')).toBeUndefined();
  });

  it('FE-PLANNER-ORIGINS-004: a pick owns what it wrote and drops what it cleared', () => {
    expect(originsAfterPick({ website: 'user', phone: 'google' }, ['name', 'website'], ['phone'], 'osm')).toEqual({
      website: 'osm',
    });
  });

  it('FE-PLANNER-ORIGINS-005: mergeResult records the pick, and a typed field it leaves alone keeps its origin', () => {
    const autoFilled = new Set<ResultField>(['phone']);
    const prev = {
      ...DEFAULT_FORM,
      phone: '+49 1',
      email: 'me@x.de',
      fieldOrigins: { phone: 'trek' as const, email: 'user' as const },
    };
    const next = mergeResult(prev, { name: 'Cafe', website: 'https://cafe.example', osm_id: 'node:4' }, autoFilled);
    expect(next.website).toBe('https://cafe.example');
    expect(next.phone).toBe('');
    expect(next.fieldOrigins).toEqual({ email: 'user', website: 'osm' });
  });
});
