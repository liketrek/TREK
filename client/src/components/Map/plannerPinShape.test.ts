// FE-PLANNER-PIN-001: a stop is a numbered pin, a shaping point a small dot without a number (P2A-03).
import { describe, expect, it } from 'vitest';
import { plannerPinShape } from './plannerPinShape';

describe('plannerPinShape', () => {
  it('FE-PLANNER-PIN-001: numbers a stop by its label or its place, and leaves a shaping point blank and small', () => {
    expect(plannerPinShape({}, 2, false)).toEqual({ size: 26, text: '3' });
    expect(plannerPinShape({ label: '2' }, 4, true)).toEqual({ size: 30, text: '2' });
    expect(plannerPinShape({ shaping: true, label: '9' }, 1, false)).toEqual({ size: 14, text: '' });
    expect(plannerPinShape({ shaping: true }, 1, true)).toEqual({ size: 18, text: '' });
  });
});
