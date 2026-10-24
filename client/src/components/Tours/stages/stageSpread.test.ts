// FE-TOUR-STAGE-SPREAD-001 to FE-TOUR-STAGE-SPREAD-009: the stages of a multi-day tour put on the
// trip's days from one day on, one a day, and the two ways a tour goes on a day (MDT-02).
import { describe, expect, it } from 'vitest';
import type { AssignmentsMap } from '../../../types';
import { planStageSpread, stageKeysOfTour, stagesThatFit, tourDayChoices } from './stageSpread';

const DAYS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
const KEYS = ['stop-a', 'stop-b', 'stop-c'];
const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key);

/** Tour 9 on the days given as `{ day: [assignment id, stage key or null] }`; place 5 on day 2 as a neighbour. */
function plan(held: Record<number, [number, string | null]>) {
  const assignments: AssignmentsMap = { '1': [], '2': [], '3': [], '4': [] };
  assignments['2'].push({ id: 500, place_id: 5, tour_stage_key: null } as never);
  for (const [day, [id, key]] of Object.entries(held)) {
    assignments[day].push({ id, place_id: 9, tour_stage_key: key } as never);
  }
  return (dayId: number, keys = KEYS) => planStageSpread({ placeId: 9, keys, days: DAYS, assignments, dayId });
}

describe('stage spread', () => {
  it('FE-TOUR-STAGE-SPREAD-001: reads the stage keys off the stops, the last stop starting none', () => {
    const stops = KEYS.concat('stop-end').map((key) => ({ key, lat: 47, lng: 11 }));
    expect(stageKeysOfTour({ stage_stops: stops })).toEqual(KEYS);
    expect(stageKeysOfTour({ stage_stops: null })).toEqual([]);
    expect(stageKeysOfTour(undefined)).toEqual([]);
  });

  it('FE-TOUR-STAGE-SPREAD-002: counts the stages that fit before the trip ends, and none for a day it has not', () => {
    expect(stagesThatFit(DAYS, 1, 3)).toBe(3);
    expect(stagesThatFit(DAYS, 3, 3)).toBe(2);
    expect(stagesThatFit(DAYS, 4, 3)).toBe(1);
    expect(stagesThatFit(DAYS, 99, 3)).toBe(0);
  });

  it('FE-TOUR-STAGE-SPREAD-003: puts each stage on the next day in order, leaving other places alone', () => {
    const result = plan({})(2);
    expect(result.steps).toEqual([
      { kind: 'create', dayId: 2, key: 'stop-a' },
      { kind: 'create', dayId: 3, key: 'stop-b' },
      { kind: 'create', dayId: 4, key: 'stop-c' },
    ]);
    expect(result.placed.map((stage) => stage.dayId)).toEqual([2, 3, 4]);
    expect(result.unplaced).toBe(0);
    expect(result.wholeOff).toEqual([]);
  });

  it('FE-TOUR-STAGE-SPREAD-004: past the last day the rest stay on no day, never on a day made up', () => {
    const result = plan({ 1: [11, 'stop-c'] })(3);
    expect(result.steps).toEqual([
      { kind: 'remove', dayId: 1, assignmentId: 11 },
      { kind: 'create', dayId: 3, key: 'stop-a' },
      { kind: 'create', dayId: 4, key: 'stop-b' },
    ]);
    expect(result.placed).toEqual([
      { key: 'stop-a', dayId: 3 },
      { key: 'stop-b', dayId: 4 },
    ]);
    expect(result.unplaced).toBe(1);
  });

  it('FE-TOUR-STAGE-SPREAD-005: a stage on its day stays and one on another day moves', () => {
    const result = plan({ 1: [11, 'stop-a'], 4: [14, 'stop-b'] })(1);
    expect(result.steps).toEqual([
      { kind: 'move', assignmentId: 14, fromDayId: 4, toDayId: 2 },
      { kind: 'create', dayId: 3, key: 'stop-c' },
    ]);
  });

  it('FE-TOUR-STAGE-SPREAD-006: the whole tour and a stage the route no longer has come off first', () => {
    const result = plan({ 1: [11, null], 3: [13, 'stop-gone'] })(1);
    expect(result.steps.slice(0, 2)).toEqual([
      { kind: 'remove', dayId: 1, assignmentId: 11 },
      { kind: 'remove', dayId: 3, assignmentId: 13 },
    ]);
    expect(result.steps.slice(2).map((step) => step.kind)).toEqual(['create', 'create', 'create']);
    expect(result.wholeOff).toEqual([1]);
  });

  it('FE-TOUR-STAGE-SPREAD-007: a stage waits until the one on its day has moved on', () => {
    const result = plan({ 2: [12, 'stop-b'], 3: [13, 'stop-c'] })(3, ['stop-b', 'stop-c']);
    expect(result.steps).toEqual([
      { kind: 'move', assignmentId: 13, fromDayId: 3, toDayId: 4 },
      { kind: 'move', assignmentId: 12, fromDayId: 2, toDayId: 3 },
    ]);
  });

  it('FE-TOUR-STAGE-SPREAD-008: two stages that would swap days: one comes off and goes on again', () => {
    const result = plan({ 1: [11, 'stop-b'], 2: [12, 'stop-a'] })(1, ['stop-a', 'stop-b']);
    expect(result.steps).toEqual([
      { kind: 'remove', dayId: 1, assignmentId: 11 },
      { kind: 'move', assignmentId: 12, fromDayId: 2, toDayId: 1 },
      { kind: 'create', dayId: 2, key: 'stop-b' },
    ]);
    expect(plan({})(99).placed).toEqual([]);
  });

  it('FE-TOUR-STAGE-SPREAD-009: words the two ways, whole greyed out on a day that holds the tour', () => {
    const [whole, stages] = tourDayChoices({ count: 3, fit: 3, wholeFree: true }, t);
    expect(whole).toEqual({
      how: 'whole',
      title: 'tours.stages.placeWhole',
      hint: 'tours.stages.placeWholeHint',
      disabled: false,
    });
    expect(stages).toEqual({
      how: 'stages',
      title: 'tours.stages.placeStages',
      hint: 'tours.stages.placeStagesHint',
      disabled: false,
    });
    const [taken, short] = tourDayChoices({ count: 3, fit: 2, wholeFree: false }, t);
    expect(taken.disabled).toBe(true);
    expect(taken.hint).toBe('tours.stages.placeWholeTaken');
    expect(short.title).toBe('tours.stages.placeStagesFit {"last":2}');
    expect(short.hint).toBe('tours.stages.placeStagesShort {"last":2}');
  });
});
