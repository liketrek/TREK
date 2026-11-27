// FE-PLANNER-STOPNUM-001 to -002: the one stop count the map's pins and the plan's rows read (#2584).
import { describe, expect, it } from 'vitest';

import type { Assignment } from '../../types';
import { stopNumbersOfDay } from './stopNumbers';

const stop = (id: number, order_index: number, place: Partial<NonNullable<Assignment['place']>> | null = {}) =>
  ({ id, order_index, place: place && { id: id * 10, ...place } }) as unknown as Assignment;

describe('stopNumbersOfDay', () => {
  it('FE-PLANNER-STOPNUM-001: numbers the stops from 1 in their stored order', () => {
    const numbers = stopNumbersOfDay([stop(3, 2), stop(1, 0), stop(2, 1)]);
    expect([...numbers.entries()]).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it('FE-PLANNER-STOPNUM-002: passes over service stops and rows without a place', () => {
    const numbers = stopNumbersOfDay([stop(1, 0), stop(2, 1, { stop_type: 'fuel' }), stop(3, 2, null), stop(4, 3)]);
    expect(numbers.get(1)).toBe(1);
    expect(numbers.has(2)).toBe(false);
    expect(numbers.has(3)).toBe(false);
    expect(numbers.get(4)).toBe(2);
  });
});
