// FE-TOUR-STAGE-MODEL-001 to FE-TOUR-STAGE-MODEL-013: the stages of a multi-day tour, cut from its one route (MDT-01, MDT-02).
import { hikingTimeMinutes, MAX_TOUR_STAGES, runMinutesAtPace } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import {
  canEndStage,
  legLengthsAlong,
  lostStageEnds,
  stageBoundariesM,
  stageEndCount,
  stageSpansOf,
  stageTotalsOf,
  tourStagesOf,
  vertexIndicesOf,
  withoutStageEnds,
  withStageEnd,
  type TourStageInputs,
} from './tourStages';

const point = (id: string, lat: number, extra: Partial<TourPlannerWaypoint> = {}): TourPlannerWaypoint => ({
  id,
  lat,
  lng: 11,
  role: 'via',
  ...extra,
});

/** Five stops due north, 0.01 degrees apart. */
const FIVE = [point('a', 48), point('b', 48.01), point('c', 48.02), point('d', 48.03), point('e', 48.04)];
const withEnds = (...ids: string[]) => FIVE.map((p) => (ids.includes(p.id) ? { ...p, stageEnd: true } : p));
const LINE = FIVE.map((p, index): [number, number, number] => [p.lat, p.lng, [500, 600, 550, 650, 600][index]]);

function input(points: TourPlannerWaypoint[], extra: Partial<TourStageInputs> = {}): TourStageInputs {
  return {
    points,
    line: LINE,
    tourType: 'hike',
    routerSeconds: 4 * 3600,
    paddle: null,
    runPaceSecondsPerKm: null,
    ...extra,
  };
}

describe('tourStages', () => {
  it('FE-TOUR-STAGE-MODEL-001: splits the points at their stage ends, in route order', () => {
    expect(stageSpansOf([])).toEqual([]);
    expect(stageSpansOf(FIVE)).toEqual([{ number: 1, from: 0, to: 4 }]);
    expect(stageSpansOf(withEnds('b', 'd'))).toEqual([
      { number: 1, from: 0, to: 1 },
      { number: 2, from: 1, to: 3 },
      { number: 3, from: 3, to: 4 },
    ]);
    // A mark on an end of the tour ends nothing.
    expect(stageSpansOf(withEnds('a', 'e'))).toHaveLength(1);
    expect(stageEndCount(withEnds('b', 'd'))).toBe(2);
  });

  it('FE-TOUR-STAGE-MODEL-002: a stage ends only at a stop between start and end, while the tour has room', () => {
    expect(canEndStage(FIVE, 'a')).toBe(false);
    expect(canEndStage(FIVE, 'e')).toBe(false);
    expect(canEndStage(FIVE, 'missing')).toBe(false);
    expect(canEndStage([FIVE[0], { ...FIVE[1], shaping: true }, FIVE[4]], 'b')).toBe(false);
    expect(canEndStage(FIVE, 'c')).toBe(true);
    const full = Array.from({ length: MAX_TOUR_STAGES + 2 }, (_, index) =>
      point(`p${index}`, 48 + index / 100, index > 0 && index < MAX_TOUR_STAGES ? { stageEnd: true } : {})
    );
    expect(stageEndCount(full)).toBe(MAX_TOUR_STAGES - 1);
    expect(canEndStage(full, `p${MAX_TOUR_STAGES}`)).toBe(false);
    // One that ends a stage can always stop doing so.
    expect(canEndStage(full, 'p1')).toBe(true);
  });

  it('FE-TOUR-STAGE-MODEL-003: sets and takes a stage end, the same points where nothing changes', () => {
    const set = withStageEnd(FIVE, 'c', true);
    expect(set[2].stageEnd).toBe(true);
    expect(withStageEnd(set, 'c', true)).toBe(set);
    expect(withStageEnd(FIVE, 'a', true)).toBe(FIVE);
    expect(withStageEnd(FIVE, 'missing', true)).toBe(FIVE);
    const taken = withStageEnd(set, 'c', false);
    expect(taken[2]).not.toHaveProperty('stageEnd');
    expect(withoutStageEnds(FIVE)).toBe(FIVE);
    expect(withoutStageEnds(withEnds('b', 'd')).some((p) => 'stageEnd' in p)).toBe(false);
  });

  it('FE-TOUR-STAGE-MODEL-004: counts the stage ends a change lost, never one taken away on purpose', () => {
    const current = withEnds('b', 'd');
    const removed = current.filter((p) => p.id !== 'b');
    expect(lostStageEnds(current, removed, removed)).toBe(1);
    const shaped = current.map((p) => (p.id === 'd' ? { ...p, shaping: true } : p));
    const dropped = shaped.map((p) => (p.id === 'd' ? { ...p, stageEnd: undefined } : p));
    expect(lostStageEnds(current, shaped, dropped)).toBe(1);
    const cleared = withStageEnd(current, 'b', false);
    expect(lostStageEnds(current, cleared, cleared)).toBe(0);
    expect(lostStageEnds(current, current, current)).toBe(0);
  });

  it('FE-TOUR-STAGE-MODEL-005: places every point on the line in order, at the first pass of a route that comes by twice', () => {
    expect(vertexIndicesOf(FIVE, LINE)).toEqual([0, 1, 2, 3, 4]);
    const outAndBack: Array<[number, number]> = [
      [48, 11],
      [48.01, 11],
      [48.02, 11],
      [48.01, 11],
      [48, 11],
    ];
    const there = [point('s', 48), point('m', 48.01), point('t', 48.02), point('r', 48)];
    expect(vertexIndicesOf(there, outAndBack)).toEqual([0, 1, 2, 4]);
  });

  it('FE-TOUR-STAGE-MODEL-006: a hike stage is timed by the signposts over its own climb and descent', () => {
    const stages = tourStagesOf(input(withEnds('c')));
    expect(stages.map((stage) => [stage.fromId, stage.toId, stage.gain, stage.loss])).toEqual([
      ['a', 'c', 100, 50],
      ['c', 'e', 100, 50],
    ]);
    const first = stages[0];
    expect(first.minutes).toBe(hikingTimeMinutes(first.distanceKm ?? 0, 100, 50));
    expect(first.fromM).toBe(0);
    expect(stages[1].fromM).toBe(first.toM);
    expect(stageBoundariesM(stages)).toEqual([first.toM]);
  });

  it('FE-TOUR-STAGE-MODEL-007: a ride or a walk shares the router time out by distance', () => {
    const stages = tourStagesOf(input(withEnds('b'), { tourType: 'bike' }));
    expect(stages.map((stage) => stage.minutes)).toEqual([60, 180]);
    expect(stages.every((stage) => !stage.overDay)).toBe(true);
    const unknown = tourStagesOf(input(withEnds('b'), { tourType: 'walk', routerSeconds: null }));
    expect(unknown.map((stage) => stage.minutes)).toEqual([null, null]);
  });

  it('FE-TOUR-STAGE-MODEL-013: a run stage is its distance at the pace, a ride on horseback has no time (RUN-01, HOR-01)', () => {
    const run = tourStagesOf(input(withEnds('b'), { tourType: 'run', runPaceSecondsPerKm: 360 }));
    expect(run.map((stage) => stage.minutes)).toEqual(run.map((stage) => runMinutesAtPace(stage.distanceKm ?? 0, 360)));
    // The router's walking time never stands in, neither without a pace nor with one out of bounds.
    const noPace = tourStagesOf(input(withEnds('b'), { tourType: 'run' }));
    expect(noPace.map((stage) => stage.minutes)).toEqual([null, null]);
    const outOfBounds = tourStagesOf(input(withEnds('b'), { tourType: 'run', runPaceSecondsPerKm: 5 }));
    expect(outOfBounds.map((stage) => stage.minutes)).toEqual([null, null]);
    const ride = tourStagesOf(input(withEnds('b'), { tourType: 'horse' }));
    expect(ride.map((stage) => stage.minutes)).toEqual([null, null]);
    expect(ride.every((stage) => stage.distanceKm !== null && !stage.overDay)).toBe(true);
  });

  it('FE-TOUR-STAGE-MODEL-014: a multi-day ski tour has its stages measured but untimed, never the router time (SKI-02)', () => {
    const ski = tourStagesOf(input(withEnds('b'), { tourType: 'ski' }));
    expect(ski).toHaveLength(2);
    expect(ski.map((stage) => stage.minutes)).toEqual([null, null]);
    expect(ski.every((stage) => stage.distanceKm !== null && stage.gain !== null && !stage.overDay)).toBe(true);
  });

  it('FE-TOUR-STAGE-MODEL-008: a paddle stage has no heights and is timed at the paddler speed, its lock passed once', () => {
    const lock = { wait_minutes: 10, transit_minutes: 5 };
    const points = withEnds('c').map((p) => (p.id === 'c' ? { ...p, lock } : p));
    const legLengths = [1000, 1000, 1000, 1000];
    const paddle = { effectiveSpeedKmh: 4, portageSpeedKmh: null, speedInvalid: false, legLengths };
    const stages = tourStagesOf(input(points, { tourType: 'kayak', paddle }));
    expect(stages.map((stage) => [stage.gain, stage.loss])).toEqual([
      [null, null],
      [null, null],
    ]);
    // 2 km at 4 km/h is half an hour; the lock at the stage end counts on the first day only.
    expect(stages.map((stage) => stage.minutes)).toEqual([45, 30]);
    const unknownSpeed = { effectiveSpeedKmh: null, portageSpeedKmh: null, speedInvalid: true };
    const stopped = tourStagesOf(input(points, { tourType: 'kayak', paddle: unknownSpeed }));
    expect(stopped.map((stage) => stage.minutes)).toEqual([null, null]);
  });

  it('FE-TOUR-STAGE-MODEL-009: a stage of more than a day on the move says so', () => {
    const stages = tourStagesOf(input(withEnds('b'), { tourType: 'bike', routerSeconds: 4 * 24 * 3600 }));
    expect(stages.map((stage) => stage.overDay)).toEqual([false, true]);
  });

  it('FE-TOUR-STAGE-MODEL-010: without a route for these points every stage is there, unmeasured', () => {
    const stages = tourStagesOf(input(withEnds('b'), { line: null }));
    expect(stages).toHaveLength(2);
    expect(stages.every((stage) => stage.distanceKm === null && stage.minutes === null && stage.toM === null)).toBe(
      true
    );
    expect(stageBoundariesM(stages)).toEqual([]);
    // Two stops at the same spot of the line measure nothing between them.
    const together = tourStagesOf(input([FIVE[0], { ...FIVE[0], id: 'twin', stageEnd: true }, FIVE[4]]));
    expect(together[0].distanceKm).toBe(0);
    expect(together[0].gain).toBe(0);
  });

  it('FE-TOUR-STAGE-MODEL-011: measures each leg along the line, and leaves a leg of one vertex to the estimate (MDT-02)', () => {
    const legs = legLengthsAlong([FIVE[0], FIVE[2], FIVE[4]], LINE);
    expect(legs).toHaveLength(2);
    expect(legs[0]).toBeCloseTo(2224, -1);
    expect(legs[1]).toBeCloseTo(2224, -1);
    expect(legLengthsAlong([FIVE[0], FIVE[0]], LINE)).toEqual([null]);
  });

  it('FE-TOUR-STAGE-MODEL-012: adds the stages up only as far as they tell, with how many do (MDT-02)', () => {
    const stages = tourStagesOf(input(withEnds('b', 'd')));
    const totals = stageTotalsOf(stages);
    expect(totals.distanceKm.known).toBe(3);
    expect(totals.distanceKm.value).toBeCloseTo(4.45, 1);
    expect(totals.gain).toEqual({ value: stages.reduce((sum, stage) => sum + (stage.gain ?? 0), 0), known: 3, of: 3 });
    const partial = stageTotalsOf([stages[0], { ...stages[1], minutes: null, distanceKm: null }]);
    expect(partial.minutes).toMatchObject({ known: 1, of: 2, value: stages[0].minutes });
    expect(partial.distanceKm.known).toBe(1);
    expect(stageTotalsOf([{ ...stages[0], gain: null }]).gain).toEqual({ value: null, known: 0, of: 1 });
  });
});
