import { BadParams } from '../../../src/nest-rpc/rpc-errors';
import { optionalRowIdParam, rowIdParam } from '../../../src/nest-rpc/rpc-params';

import { describe, expect, it } from 'vitest';

describe('rowIdParam', () => {
  it('RPCPARAM-001: takes a safe integer and the decimal string of one, as the published contract allows', () => {
    expect(rowIdParam(5, 'tripId')).toBe(5);
    expect(rowIdParam('5', 'tripId')).toBe(5);
    expect(rowIdParam('007', 'tripId')).toBe(7);
  });

  it('RPCPARAM-002: refuses what num() let through and an engine reads its own way, with num() message', () => {
    for (const value of ['0x5', '5e0', '5.0', '+5', ' 5', 1.5, 1e20, '99999999999999999999', '-1', 'abc', undefined]) {
      expect(() => rowIdParam(value, 'tripId'), String(value)).toThrow(new BadParams('tripId must be a number'));
    }
  });

  it('RPCPARAM-003: optionalRowIdParam leaves an absent param out and reads any other one like rowIdParam', () => {
    expect(optionalRowIdParam(undefined, 'dayId')).toBeUndefined();
    expect(optionalRowIdParam('5', 'dayId')).toBe(5);
    for (const value of [null, '0x5', '5e0', 1.5, '']) {
      expect(() => optionalRowIdParam(value, 'dayId'), String(value)).toThrow(new BadParams('dayId must be a number'));
    }
  });
});
