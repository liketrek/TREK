import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  FERRATAS_ATTRIBUTION,
  ferrataBboxSpanOk,
  ferrataGradeSchema,
  ferratasQuerySchema,
  ferratasResponseSchema,
} from './ferratas.schema';

import { describe, expect, it } from 'vitest';

function messages(bbox: unknown): string[] {
  const parsed = ferratasQuerySchema.safeParse({ bbox });
  return parsed.success ? [] : parsed.error.issues.map((issue) => issue.message);
}

describe('ferratasQuerySchema', () => {
  it('reads south,west,north,east into named edges', () => {
    expect(ferratasQuerySchema.parse({ bbox: '47.1,11.2,47.4,11.6' }).bbox).toEqual({
      south: 47.1,
      west: 11.2,
      north: 47.4,
      east: 11.6,
    });
  });

  it('tolerates spaces around the edges', () => {
    expect(ferratasQuerySchema.parse({ bbox: ' 47.1 , 11.2,47.4 ,11.6 ' }).bbox.north).toBe(47.4);
  });

  it.each([
    ['too few edges', '47.1,11.2,47.4'],
    ['too many edges', '47.1,11.2,47.4,11.6,1'],
    ['an empty edge', '47.1,,47.4,11.6'],
    ['a word', '47.1,abc,47.4,11.6'],
    ['an empty string', ''],
    ['Infinity', '47.1,11.2,Infinity,11.6'],
  ])('refuses %s', (_label, bbox) => {
    expect(messages(bbox)).toEqual([FERRATA_BBOX_INVALID_MESSAGE]);
  });

  it('refuses a missing bbox and a non-string one', () => {
    expect(ferratasQuerySchema.safeParse({}).success).toBe(false);
    expect(ferratasQuerySchema.safeParse({ bbox: ['47', '11', '48', '12'] }).success).toBe(false);
  });

  it('refuses edges in the wrong order', () => {
    expect(messages('47.4,11.2,47.1,11.6')).toContain(FERRATA_BBOX_INVALID_MESSAGE);
    expect(messages('47.1,11.6,47.4,11.2')).toContain(FERRATA_BBOX_INVALID_MESSAGE);
  });

  it('refuses coordinates off the globe', () => {
    expect(messages('-91,11,-90.5,11.2').length).toBeGreaterThan(0);
    expect(messages('47,180.1,47.2,180.3').length).toBeGreaterThan(0);
  });

  it('caps the span per side', () => {
    expect(messages('47,11,47.5,11.5')).toEqual([]);
    expect(messages('47,11,47.6,11.2')).toEqual([FERRATA_BBOX_TOO_LARGE_MESSAGE]);
    expect(messages('47,11,47.2,11.6')).toEqual([FERRATA_BBOX_TOO_LARGE_MESSAGE]);
  });

  it('takes a 0.500 span whose float difference lands a hair above 0.5', () => {
    // 64.001 - 63.501 is 0.5000000000000071 in doubles.
    expect(64.001 - 63.501).toBeGreaterThan(0.5);
    expect(messages('63.501,11.000,64.001,11.200')).toEqual([]);
    expect(ferrataBboxSpanOk({ south: 63.501, west: 11, north: 64.001, east: 11.2 })).toBe(true);
    expect(ferrataBboxSpanOk({ south: 63.5, west: 11, north: 64.001, east: 11.2 })).toBe(false);
  });

  it('refuses an oversized query string before splitting it', () => {
    expect(ferratasQuerySchema.safeParse({ bbox: '1,'.repeat(150) }).success).toBe(false);
  });
});

describe('ferrataGradeSchema', () => {
  it('accepts a parsed grade and an unknown one', () => {
    expect(ferrataGradeSchema.safeParse({ raw: '3+', level: 3, plus: '+' }).success).toBe(true);
    expect(ferrataGradeSchema.safeParse({ raw: 'C/D', level: null, plus: null }).success).toBe(true);
    expect(ferrataGradeSchema.safeParse({ raw: null, level: null, plus: null }).success).toBe(true);
  });

  it('refuses a level outside 0 to 6', () => {
    expect(ferrataGradeSchema.safeParse({ raw: '7', level: 7, plus: null }).success).toBe(false);
  });
});

describe('ferratasResponseSchema', () => {
  const ferrata = {
    id: 'way/123',
    name: 'Klettersteig',
    grade: { raw: '2', level: 2, plus: null },
    routeName: null,
    geometry: [
      [47.1, 11.2],
      [47.2, 11.3],
    ],
    osmUrl: 'https://www.openstreetmap.org/way/123',
  };
  const base = { truncated: false, source: 'openstreetmap', attribution: FERRATAS_ATTRIBUTION };

  it('accepts a well-formed answer', () => {
    expect(ferratasResponseSchema.safeParse({ ...base, ferratas: [ferrata] }).success).toBe(true);
  });

  it('refuses an id that is not a way, and a line with one point', () => {
    expect(ferratasResponseSchema.safeParse({ ...base, ferratas: [{ ...ferrata, id: 'node/1' }] }).success).toBe(false);
    expect(
      ferratasResponseSchema.safeParse({ ...base, ferratas: [{ ...ferrata, geometry: [[47.1, 11.2]] }] }).success,
    ).toBe(false);
  });

  it('pins the attribution', () => {
    expect(ferratasResponseSchema.safeParse({ ...base, attribution: 'someone', ferratas: [] }).success).toBe(false);
  });
});
