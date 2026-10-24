import type { TourTrailGrade } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { highestStep, SAC_FACET, sacStepOfClass } from './sacGrades';

// FE-HIKE-SAC-001 to FE-HIKE-SAC-004

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

describe('sacGrades (MAP-03)', () => {
  it('FE-HIKE-SAC-001: reads a way to its step as OpenStreetMap wrote it, an unclear grade as unclear, none as untagged', () => {
    expect(SAC_FACET.read(grade({ sac_scale: 'demanding_mountain_hiking' }))).toEqual({
      key: 't3',
      written: 'demanding_mountain_hiking',
    });
    expect(SAC_FACET.read(grade({ sac_scale: 'hiking' })).key).toBe('t1');
    expect(SAC_FACET.read(grade({ sac_scale_unclear: 'T3;T4' }))).toEqual({ key: 'unclear', written: 'T3;T4' });
    // A surface or a kind of way says nothing about the grade.
    expect(SAC_FACET.read(grade({ surface: 'rock', highway: 'path' }))).toEqual({ key: 'untagged', written: null });
    expect(SAC_FACET.read(undefined)).toEqual({ key: 'untagged', written: null });
  });

  it('FE-HIKE-SAC-002: names a step by its class and paints it in its own colour', () => {
    expect(SAC_FACET.classes).toEqual(['t1', 't2', 't3', 't4', 't5', 't6']);
    expect(SAC_FACET.paint('t2')).toBe('t2');
  });

  it('FE-HIKE-SAC-003: a class stands for its step, the unknown and other facets for none', () => {
    expect(sacStepOfClass('t6')).toBe(6);
    expect(sacStepOfClass('t1')).toBe(1);
    expect(sacStepOfClass('untagged')).toBeNull();
    expect(sacStepOfClass('unclear')).toBeNull();
    expect(sacStepOfClass('gravel')).toBeNull();
    expect(sacStepOfClass('t7')).toBeNull();
  });

  it('FE-HIKE-SAC-004: the highest step known, or none where no step is', () => {
    expect(highestStep([{ key: 't1' }, { key: 't3' }, { key: 'untagged' }])).toBe(3);
    expect(highestStep([{ key: 'unclear' }, { key: 'unmatched' }])).toBeNull();
    expect(highestStep([])).toBeNull();
  });
});
