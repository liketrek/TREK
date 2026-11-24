import { paginationQuerySchema } from './pagination.schema';
import {
  idSchema,
  idParamSchema,
  isoDateTime,
  nonEmptyString,
  rowIdInputSchema,
  rowIdStringSchema,
} from './primitives.schema';

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

  it('idParamSchema takes only the decimal spelling of an id, the rule the server reads ids with', () => {
    expect(idParamSchema.parse('007')).toBe(7);
    expect(idParamSchema.parse(42)).toBe(42);
    for (const spelling of ['0x5', '5e0', '5.0', '+5', ' 5', '5 ', '1_000', '-5', '0', '', '99999999999999999999']) {
      expect(idParamSchema.safeParse(spelling).success, spelling).toBe(false);
    }
    expect(idParamSchema.safeParse(1.5).success).toBe(false);
    expect(idParamSchema.safeParse(2 ** 60).success).toBe(false);
  });

  it('rowIdInputSchema keeps an id as sent and refuses every spelling toRowId refuses', () => {
    expect(rowIdInputSchema.parse(42)).toBe(42);
    expect(rowIdInputSchema.parse('42')).toBe('42');
    expect(rowIdInputSchema.parse('007')).toBe('007');
    for (const spelling of ['0x5', '5e0', '5.0', '+5', ' 5', '5 ', '5_0', '-5', '', 'abc', '99999999999999999999']) {
      expect(rowIdInputSchema.safeParse(spelling).success, spelling).toBe(false);
      expect(rowIdStringSchema.safeParse(spelling).success, spelling).toBe(false);
    }
    expect(rowIdInputSchema.safeParse(1.5).success).toBe(false);
    expect(rowIdInputSchema.safeParse(1e20).success).toBe(false);
    expect(rowIdStringSchema.safeParse(5).success).toBe(false);
    for (const value of ['0x5', 1.5, '99999999999999999999']) {
      expect(rowIdInputSchema.safeParse(value).error?.issues[0]?.message, String(value)).toBe('Invalid id');
    }
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
