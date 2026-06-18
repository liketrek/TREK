import { paginationQuerySchema } from './pagination.schema';
import { idSchema, idParamSchema, nonEmptyString, isoDateTime } from './primitives.schema';

import { describe, it, expect } from 'vitest';

describe('@trek/shared primitives', () => {
  it('idSchema accepts positive integers, rejects others', () => {
    expect(idSchema.parse(1)).toBe(1);
    expect(idSchema.safeParse(0).success).toBe(false);
    expect(idSchema.safeParse(-3).success).toBe(false);
    expect(idSchema.safeParse(1.5).success).toBe(false);
  });

  it('idParamSchema coerces string params to a positive int', () => {
    expect(idParamSchema.parse('42')).toBe(42);
    expect(idParamSchema.safeParse('abc').success).toBe(false);
  });

  it('nonEmptyString trims and rejects empty', () => {
    expect(nonEmptyString.parse('  hi ')).toBe('hi');
    expect(nonEmptyString.safeParse('   ').success).toBe(false);
  });

  it('isoDateTime accepts an ISO timestamp', () => {
    expect(isoDateTime.safeParse('2026-05-25T08:38:14Z').success).toBe(true);
    expect(isoDateTime.safeParse('not-a-date').success).toBe(false);
  });
});

describe('@trek/shared pagination', () => {
  it('applies defaults and coerces', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, perPage: 50 });
    expect(paginationQuerySchema.parse({ page: '2', perPage: '10' })).toEqual({
      page: 2,
      perPage: 10,
    });
  });

  it('enforces bounds', () => {
    expect(paginationQuerySchema.safeParse({ perPage: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ perPage: 999 }).success).toBe(false);
  });
});
