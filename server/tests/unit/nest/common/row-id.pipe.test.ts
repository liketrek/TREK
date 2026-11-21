import { intParam, ParseRowIdPipe, rowId } from '../../../../src/nest/common/row-id.pipe';
import { HttpException } from '@nestjs/common';

import { describe, expect, it } from 'vitest';

/** The status and body a pipe answers `value` with, or the id it hands on. */
function answer(
  pipe: { transform(value: unknown): number },
  value: unknown,
): number | { status: number; body: unknown } {
  try {
    return pipe.transform(value);
  } catch (err) {
    if (!(err instanceof HttpException)) throw err;
    return { status: err.getStatus(), body: err.getResponse() };
  }
}

const MALFORMED = ['0x5', '5e0', '5.0', '+5', '5_0', ' 5', '-5', 'abc', '', '99999999999999999999'];

describe('RowIdPipe', () => {
  it('ROWIDPIPE-001: hands the handler the id as a number', () => {
    expect(answer(rowId('Journey not found'), '5')).toBe(5);
    expect(answer(rowId('Journey not found'), '007')).toBe(7);
  });

  it("ROWIDPIPE-002: answers every spelling toRowId refuses with the route's own not-found", () => {
    for (const value of MALFORMED) {
      expect(answer(rowId('Journey not found'), value), value).toEqual({
        status: 404,
        body: { error: 'Journey not found' },
      });
    }
    expect(answer(rowId('Not allowed', 403), '0x5')).toEqual({ status: 403, body: { error: 'Not allowed' } });
  });

  it("ROWIDPIPE-003: ParseRowIdPipe keeps ParseIntPipe's 400 and message and refuses what it let through", () => {
    const pipe = new ParseRowIdPipe();
    expect(answer(pipe, '12')).toBe(12);
    for (const value of ['-1', '99999999999999999999', '1.5', 'abc']) {
      expect(answer(pipe, value), value).toEqual({
        status: 400,
        body: { error: 'Validation failed (numeric string is expected)' },
      });
    }
  });

  it('ROWIDPIPE-004: intParam answers 400 with its message for a whole number that is not one', () => {
    expect(answer(intParam('Invalid year'), '2026')).toBe(2026);
    expect(answer(intParam('Invalid year'), '2026.0')).toEqual({ status: 400, body: { error: 'Invalid year' } });
  });
});
