import {
  OSM_TAG_VALUE_MAX,
  SAC_SCALE_VALUES,
  sacStepOf,
  tourTrailGradeRequestSchema,
  tourTrailGradeResponseSchema,
  tourTrailGradeSchema,
} from './tour-trail-grade.schema';

import { describe, expect, it } from 'vitest';

const grade = {
  id: 1,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
};

describe('tour trail grades (BIK-05, MAP-03, MAP-04)', () => {
  it('TRAIL-GRADE-SCHEMA-001: reads the six sac_scale values to T1 to T6 in order', () => {
    expect(SAC_SCALE_VALUES.map(sacStepOf)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(sacStepOf('hiking')).toBe(1);
    expect(sacStepOf('difficult_alpine_hiking')).toBe(6);
  });

  it('TRAIL-GRADE-SCHEMA-002: takes a way with an SAC grade, or with one written unclearly, and nothing else', () => {
    expect(tourTrailGradeSchema.parse({ ...grade, sac_scale: 'alpine_hiking' }).sac_scale).toBe('alpine_hiking');
    expect(tourTrailGradeSchema.parse({ ...grade, sac_scale_unclear: 'T3;T4' }).sac_scale_unclear).toBe('T3;T4');
    expect(tourTrailGradeSchema.safeParse({ ...grade, sac_scale: 'T3' }).success).toBe(false);
    expect(tourTrailGradeSchema.safeParse({ ...grade, sac_scale_unclear: '' }).success).toBe(false);
    expect(
      tourTrailGradeSchema.safeParse({ ...grade, sac_scale_unclear: 'x'.repeat(OSM_TAG_VALUE_MAX + 1) }).success,
    ).toBe(false);
  });

  it('TRAIL-GRADE-SCHEMA-003: an answer lists graded ways and the ways it could not ask about', () => {
    const answer = { ways: [{ ...grade, mtb_scale: '2+' }], unanswered: [7] };
    expect(tourTrailGradeResponseSchema.parse(answer)).toEqual(answer);
  });

  it('TRAIL-GRADE-SCHEMA-004: a question names at least one way, by a positive id, and nothing more', () => {
    expect(tourTrailGradeRequestSchema.safeParse({ way_ids: [1, 2] }).success).toBe(true);
    expect(tourTrailGradeRequestSchema.safeParse({ way_ids: [] }).success).toBe(false);
    expect(tourTrailGradeRequestSchema.safeParse({ way_ids: [0] }).success).toBe(false);
    expect(tourTrailGradeRequestSchema.safeParse({ way_ids: [1], extra: true }).success).toBe(false);
  });

  it('TRAIL-GRADE-SCHEMA-005: carries the surface and the kind of way as written, within the same bound (MAP-04)', () => {
    const written = tourTrailGradeSchema.parse({ ...grade, surface: 'fine_gravel', highway: 'path' });
    expect(written).toMatchObject({ surface: 'fine_gravel', highway: 'path' });
    expect(tourTrailGradeSchema.safeParse({ ...grade, surface: '' }).success).toBe(false);
    expect(tourTrailGradeSchema.safeParse({ ...grade, highway: 'x'.repeat(OSM_TAG_VALUE_MAX + 1) }).success).toBe(
      false,
    );
    expect(tourTrailGradeSchema.safeParse({ ...grade, surface: undefined }).success).toBe(false);
  });
});
