import { compareCodeUnits } from './compare';

import { describe, expect, it } from 'vitest';

describe('compareCodeUnits', () => {
  it('orders as a bare sort does, whatever the locale', () => {
    const texts = ['way/3', 'node/10', 'node/2', 'Node/1', 'check_date', 'canoe', '2026-09-30', '2026-10-01'];
    expect([...texts].sort(compareCodeUnits)).toEqual([...texts].sort());
    expect(compareCodeUnits('a', 'a')).toBe(0);
    expect(compareCodeUnits('a', 'b')).toBe(-1);
    expect(compareCodeUnits('b', 'a')).toBe(1);
  });
});
