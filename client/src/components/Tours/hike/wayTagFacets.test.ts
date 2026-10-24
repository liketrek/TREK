import type { TourTrailGrade } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { SURFACE_FACET, WAY_FACET } from './wayTagFacets';

// FE-HIKE-WAYTAG-001 to FE-HIKE-WAYTAG-006

const grade = (values: Partial<TourTrailGrade>): TourTrailGrade => ({
  id: 1,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
  ...values,
});

const surfaceOf = (surface: string) => SURFACE_FACET.read(grade({ surface })).key;
const wayOf = (highway: string) => WAY_FACET.read(grade({ highway })).key;

describe('wayTagFacets (MAP-04)', () => {
  it('FE-HIKE-WAYTAG-001: sorts the recorded surfaces into their groups', () => {
    expect(['asphalt', 'concrete:plates', 'paved'].map(surfaceOf)).toEqual(['paved', 'paved', 'paved']);
    expect(['sett', 'cobblestone', 'paving_stones'].map(surfaceOf)).toEqual(['sett', 'sett', 'sett']);
    expect(['compacted', 'fine_gravel'].map(surfaceOf)).toEqual(['compacted', 'compacted']);
    expect(['gravel', 'pebblestone'].map(surfaceOf)).toEqual(['gravel', 'gravel']);
    expect(['ground', 'dirt', 'earth', 'mud', 'sand'].map(surfaceOf)).toEqual(Array(5).fill('ground'));
    expect(['grass', 'rock', 'stepping_stones', 'wood', 'metal_grid', 'unpaved', 'snow'].map(surfaceOf)).toEqual([
      'grass',
      'rock',
      'rock',
      'wood',
      'wood',
      'unpaved',
      'other',
    ]);
  });

  it('FE-HIKE-WAYTAG-002: sorts the recorded kinds of way into their groups', () => {
    expect(['path', 'bridleway', 'footway', 'pedestrian', 'steps', 'track'].map(wayOf)).toEqual([
      'path',
      'path',
      'footway',
      'footway',
      'steps',
      'track',
    ]);
    expect(['cycleway', 'residential', 'service', 'secondary', 'road', 'via_ferrata', 'corridor'].map(wayOf)).toEqual([
      'cycleway',
      'quietRoad',
      'quietRoad',
      'road',
      'road',
      'viaFerrata',
      'other',
    ]);
  });

  it('FE-HIKE-WAYTAG-003: a value no group takes, or two values at once, is unclear, never the nearest group', () => {
    expect(surfaceOf('gravel;ground')).toBe('unclear');
    expect(surfaceOf('gravvel')).toBe('unclear');
    expect(wayOf('path;track')).toBe('unclear');
    expect(wayOf('motorway')).toBe('unclear');
  });

  it('FE-HIKE-WAYTAG-004: looks a value up as OpenStreetMap writes it, and hands it on as it was written', () => {
    expect(SURFACE_FACET.read(grade({ surface: 'Asphalt' }))).toEqual({ key: 'paved', written: 'Asphalt' });
    expect(WAY_FACET.read(grade({ highway: ' Track ' }))).toEqual({ key: 'track', written: ' Track ' });
  });

  it('FE-HIKE-WAYTAG-005: a way without the value is untagged, whatever else it records', () => {
    expect(SURFACE_FACET.read(grade({ highway: 'path', sac_scale: 'hiking' }))).toEqual({
      key: 'untagged',
      written: null,
    });
    expect(WAY_FACET.read(grade({ surface: 'gravel' })).key).toBe('untagged');
    expect(WAY_FACET.read(undefined).key).toBe('untagged');
  });

  it('FE-HIKE-WAYTAG-006: lists the groups in order and paints each under its facet name', () => {
    expect(SURFACE_FACET.classes[0]).toBe('paved');
    expect(SURFACE_FACET.classes).toContain('unpaved');
    expect(WAY_FACET.classes).toEqual([
      'path',
      'footway',
      'steps',
      'track',
      'cycleway',
      'quietRoad',
      'road',
      'viaFerrata',
      'other',
    ]);
    expect(SURFACE_FACET.paint('ground')).toBe('surface:ground');
    expect(WAY_FACET.paint('quietRoad')).toBe('way:quietRoad');
  });
});
