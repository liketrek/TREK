// FE-PLANNER-PIN-001: a stop is a numbered pin, a shaping point a small dot without a number (P2A-03).
// FE-PLANNER-PIN-002: the stop where a stage of a multi-day tour ends carries the moon at its corner (MDT-01).
import { describe, expect, it } from 'vitest';
import { plannerPinBadge, plannerPinShape } from './plannerPinShape';

describe('plannerPinShape', () => {
  it('FE-PLANNER-PIN-001: numbers a stop by its label or its place, and leaves a shaping point blank and small', () => {
    expect(plannerPinShape({}, 2, false)).toEqual({ size: 26, text: '3' });
    expect(plannerPinShape({ label: '2' }, 4, true)).toEqual({ size: 30, text: '2' });
    expect(plannerPinShape({ shaping: true, label: '9' }, 1, false)).toEqual({ size: 14, text: '' });
    expect(plannerPinShape({ shaping: true }, 1, true)).toEqual({ size: 18, text: '' });
  });

  it('FE-PLANNER-PIN-002: marks a stage end with the moon at the corner, and nothing else', () => {
    const badge = plannerPinBadge({ stageEnd: true, label: '3' });
    expect(badge).toContain('data-stage-end="true"');
    expect(badge).toContain('<svg');
    expect(badge).toContain('inset-inline-end');
    expect(plannerPinBadge({ label: '3' })).toBe('');
    expect(plannerPinBadge({ stageEnd: true, shaping: true })).toBe('');
  });
});
