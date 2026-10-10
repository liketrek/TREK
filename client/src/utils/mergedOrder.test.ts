// FE-UTIL-MERGEDORDER-001 to -007: the reorder writes the desktop day plan and the
// phone's plan timeline both derive from a day's new timeline order.
import { describe, expect, it } from 'vitest';

import { metadataWithLegPositions, planMergedOrder, withTransportPositions } from './mergedOrder';

const place = (id: number) => ({ type: 'place', data: { id } });
const note = (id: number) => ({ type: 'note', data: { id } });
const transport = (id: number, leg?: number) => ({
  type: 'transport',
  data: { id, __leg: leg == null ? undefined : { index: leg } },
});

describe('planMergedOrder', () => {
  it('FE-UTIL-MERGEDORDER-001: places get sequential slots and what sits between two places shares the gap', () => {
    const plan = planMergedOrder([place(1), note(7), transport(9), place(2), place(3)]);
    expect(plan.assignmentIds).toEqual([1, 2, 3]);
    expect(plan.noteUpdates).toEqual([{ id: 7, sort_order: 1 / 3 }]);
    expect(plan.transportUpdates).toEqual([{ id: 9, day_plan_position: 2 / 3 }]);
    expect(plan.legPosUpdates).toEqual({});
  });

  it('FE-UTIL-MERGEDORDER-002: rows before the first place sit below zero', () => {
    const plan = planMergedOrder([note(7), place(1)]);
    expect(plan.noteUpdates).toEqual([{ id: 7, sort_order: -0.5 }]);
    expect(plan.assignmentIds).toEqual([1]);
  });

  it('FE-UTIL-MERGEDORDER-003: the legs of one booking are positioned leg by leg', () => {
    const plan = planMergedOrder([place(1), transport(5, 0), place(2), transport(5, 1)]);
    expect(plan.legPosUpdates).toEqual({ 5: { 0: 0.5, 1: 1.5 } });
    expect(plan.transportUpdates).toEqual([]);
  });

  it('FE-UTIL-MERGEDORDER-004: a row of any other type takes a slot but writes nothing', () => {
    const plan = planMergedOrder([place(1), { type: 'other', data: { id: 3 } }, note(4), place(2)]);
    expect(plan.noteUpdates).toEqual([{ id: 4, sort_order: 2 / 3 }]);
    expect(plan.transportUpdates).toEqual([]);
  });
});

describe('withTransportPositions', () => {
  it('FE-UTIL-MERGEDORDER-005: writes the moved bookings for that day and leaves the rest as they were', () => {
    const untouched = { id: 2, day_plan_position: 4, day_positions: { 3: 4 } };
    const moved = { id: 1, day_plan_position: 0, day_positions: { 2: 9 } };
    const fresh = { id: 3 };
    const result = withTransportPositions(
      [moved, untouched, fresh],
      [
        { id: 1, day_plan_position: 1.5 },
        { id: 3, day_plan_position: 0.25 },
      ],
      7
    );
    expect(result[0]).toEqual({ id: 1, day_plan_position: 1.5, day_positions: { 2: 9, 7: 1.5 } });
    expect(result[1]).toBe(untouched);
    expect(result[2]).toEqual({ id: 3, day_plan_position: 0.25, day_positions: { 7: 0.25 } });
  });
});

describe('metadataWithLegPositions', () => {
  it('FE-UTIL-MERGEDORDER-006: writes each moved leg position for the day, from a string or an object', () => {
    const legs = [{ from: 'FRA', day_positions: { 1: 0.2 } }, { from: 'DXB' }];
    const fromString = metadataWithLegPositions(JSON.stringify({ airline: 'LH', legs }), { 1: 2.5 }, 4);
    expect(fromString).toEqual({
      airline: 'LH',
      legs: [
        { from: 'FRA', day_positions: { 1: 0.2 } },
        { from: 'DXB', day_positions: { 4: 2.5 } },
      ],
    });
    const fromObject = metadataWithLegPositions({ legs }, { 0: 1.5 }, 4);
    expect(fromObject).toEqual({ legs: [{ from: 'FRA', day_positions: { 1: 0.2, 4: 1.5 } }, { from: 'DXB' }] });
    expect((fromObject?.legs as unknown[])[1]).toBe(legs[1]);
  });

  it('FE-UTIL-MERGEDORDER-007: metadata without legs, or that cannot be read, has nothing to move', () => {
    expect(metadataWithLegPositions(JSON.stringify({ airline: 'LH' }), { 0: 1 }, 4)).toBeNull();
    expect(metadataWithLegPositions('{not json', { 0: 1 }, 4)).toBeNull();
    expect(metadataWithLegPositions(null, { 0: 1 }, 4)).toBeNull();
    expect(metadataWithLegPositions('', { 0: 1 }, 4)).toBeNull();
  });
});
