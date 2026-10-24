import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { importFields, importMissing, useGpxImportChoices, type GpxImportChoices } from './gpxImportChoices';

// FE-TOUR-GPX-CHOICES-001 to FE-TOUR-GPX-CHOICES-003

const base: GpxImportChoices = {
  type: 'hike',
  boat: null,
  water: null,
  bikeProfile: 'touring',
  runProfile: 'running',
  ski: { discipline: null, technique: null },
};

describe('GPX import choices', () => {
  it('FE-TOUR-GPX-CHOICES-001: each type names what it carries, and a hike nothing more', () => {
    expect(importFields(base)).toEqual({ tour_type: 'hike' });
    expect(importFields({ ...base, type: 'bike', bikeProfile: 'gravel' })).toEqual({
      tour_type: 'bike',
      bike_profile: 'gravel',
    });
    expect(importFields({ ...base, type: 'run', runProfile: 'trail' })).toEqual({
      tour_type: 'run',
      run_profile: 'trail',
    });
    expect(importFields({ ...base, type: 'kayak', boat: 'sup', water: 'lake' })).toEqual({
      tour_type: 'kayak',
      boat_type: 'sup',
      water_context: 'lake',
    });
    // SKI-02: a ski track its discipline, and for cross-country its technique.
    expect(importFields({ ...base, type: 'ski', ski: { discipline: 'touring', technique: null } })).toEqual({
      tour_type: 'ski',
      ski_discipline: 'touring',
    });
    expect(importFields({ ...base, type: 'ski', ski: { discipline: 'cross_country', technique: 'unknown' } })).toEqual({
      tour_type: 'ski',
      ski_discipline: 'cross_country',
      ski_technique: 'unknown',
    });
  });

  it('FE-TOUR-GPX-CHOICES-002: holds the import back while a paddle tour or a ski track lacks what it must name', () => {
    expect(importMissing(base)).toBeNull();
    expect(importMissing({ ...base, type: 'kayak', boat: 'canoe' })).toBe('paddle');
    expect(importMissing({ ...base, type: 'ski' })).toBe('ski');
    const crossCountry = { discipline: 'cross_country' as const, technique: null };
    expect(importMissing({ ...base, type: 'ski', ski: crossCountry })).toBe('ski');
    expect(importMissing({ ...base, type: 'ski', ski: { discipline: 'alpine', technique: null } })).toBeNull();
  });

  it('FE-TOUR-GPX-CHOICES-003: starts as a hike and keeps each choice on its own', () => {
    const { result } = renderHook(() => useGpxImportChoices());
    expect(result.current.chosen).toEqual(base);
    act(() => result.current.setType('ski'));
    act(() => result.current.setSki({ discipline: 'snowboard', technique: null }));
    act(() => result.current.setBoat('kayak'));
    expect(result.current.chosen).toMatchObject({ type: 'ski', boat: 'kayak', ski: { discipline: 'snowboard' } });
  });
});
