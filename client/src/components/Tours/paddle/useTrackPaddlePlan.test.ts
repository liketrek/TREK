/**
 * FE-HOOK-TRACKPADDLE-001 to FE-HOOK-TRACKPADDLE-014: the portages, locks and
 * speeds laid onto a recorded paddle track, as the planner's card and map
 * share them.
 *
 * The hook loads the marks of the open paddle import into the mark store, lays
 * them along the length of the track and reckons the paddle time from them. A
 * portage takes two clicks on the line, a lock one. Saving goes through the
 * repo with what the store holds, takes in what came back and says how it
 * went; nothing is saved for someone who may not change the tour, and the
 * track itself is never touched.
 */
import { act, renderHook } from '@testing-library/react';
import type { TourDetailResponse, TourListItem, TourPaddlePlanRequest, TrackMarks } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAllStores } from '../../../../tests/helpers/store';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { loadTrackMarks, pickOnTrack, refuseTrackPick, useTrackMarkToolStore } from '../../../store/trackMarkToolStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useTrackPaddlePlan } from './useTrackPaddlePlan';

type UpdatePaddlePlan = (
  tripId: number | string,
  placeId: number,
  body: TourPaddlePlanRequest
) => Promise<TourDetailResponse>;

const repo = vi.hoisted(() => ({ updatePaddlePlan: vi.fn<UpdatePaddlePlan>() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

type Options = Parameters<typeof useTrackPaddlePlan>[0];

/** A portage from 2 to 3 km and a lock at 6 km with both its times entered. */
const MARKS: TrackMarks = {
  portages: [{ from_m: 2000, to_m: 3000, extra_minutes: null }],
  locks: [{ at_m: 6000, wait_minutes: 10, transit_minutes: 5 }],
};
const NO_MARKS: TrackMarks = { portages: [], locks: [] };

/** A kayak import of the trip, with the marks above and no speeds of its own. */
function paddleTour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 7,
    name: 'Altmühl from Treuchtlingen',
    tour_type: 'kayak',
    distance: 12,
    elevation_gain: null,
    elevation_loss: null,
    duration: null,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: null,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    boat_type: 'kayak',
    water_context: 'river',
    paddle_speed_kmh: null,
    portage_speed_kmh: null,
    track_marks: MARKS,
    ...overrides,
  };
}

const TOUR = paddleTour();
const HIKE: TourListItem = { ...TOUR, tour_type: 'hike', boat_type: null, water_context: null, track_marks: null };

/** The planner with a recorded track open read-only, measured at this length, or with nothing open. */
function planner(tour: TourListItem | null, distanceKm = 12): TourPlannerController {
  return {
    mode: tour ? { type: 'view-gpx', placeId: tour.place_id, tour } : { type: 'neutral' },
    readOnlyGpxAnalysis: tour ? { distanceKm } : null,
  } as unknown as TourPlannerController;
}

function options(overrides: Partial<Options> = {}): Options {
  return { tripId: 3, planner: planner(TOUR), canEdit: true, onSaved: vi.fn(), ...overrides };
}

function renderPlan(props: Options = options()) {
  return renderHook((current: Options) => useTrackPaddlePlan(current), {
    initialProps: props,
    wrapper: TranslationProvider,
  });
}

/** A save the test answers by hand, so the hook can be read while it is on its way. */
function deferred() {
  let resolve: (value: TourDetailResponse) => void = () => undefined;
  const promise = new Promise<TourDetailResponse>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.updatePaddlePlan.mockReset();
  resetAllStores();
});

describe('useTrackPaddlePlan', () => {
  it('FE-HOOK-TRACKPADDLE-001: loads the marks of the open paddle import and lays them along the track', () => {
    const { result } = renderPlan();

    expect(useTrackMarkToolStore.getState().placeId).toBe(7);
    expect(result.current).toMatchObject({
      active: true,
      canEdit: true,
      saving: false,
      dirty: false,
      pick: null,
      pendingFromM: null,
      refused: null,
      totalM: 12000,
      speeds: { paddle: null, portage: null },
      recommendedPaddleSpeed: 4,
      defaultPortageSpeed: 2,
    });
    expect(result.current.marks).toEqual(MARKS);
    expect(result.current.layout).toEqual({
      totalM: 12000,
      stretches: [
        { kind: 'water', fromM: 0, toM: 2000, extraMinutes: null, startIndex: null },
        { kind: 'portage', fromM: 2000, toM: 3000, extraMinutes: null, startIndex: null },
        { kind: 'water', fromM: 3000, toM: 12000, extraMinutes: null, startIndex: null },
      ],
      locks: [{ wait_minutes: 10, transit_minutes: 5, atM: 6000, bypassed: false, index: null }],
    });
    // 11 km on water at the kayak's 4 km/h, 1 km carried at 2 km/h plus 10 minutes, and the lock's 15.
    expect(result.current.estimate).toEqual({
      waterM: 11000,
      landM: 1000,
      portageCount: 1,
      paddleSpeedKmh: 4,
      portageSpeedKmh: 2,
      waterMinutes: 165,
      carryMinutes: 30,
      portageExtraMinutes: 10,
      lockMinutes: 15,
      locksCounted: 1,
      locksMissingTime: 0,
      breakMinutes: 0,
      estimateMinutes: 220,
      complete: true,
    });
  });

  it.each<[string, TourListItem | null, number]>([
    ['with nothing open', null, 0],
    ['for a hike import', HIKE, 12000],
  ])('FE-HOOK-TRACKPADDLE-002: shows no card and empties the store %s', (_label, tour, totalM) => {
    loadTrackMarks(9, MARKS, { paddle: 5, portage: 3 });
    const { result } = renderPlan(options({ planner: planner(tour) }));

    expect(useTrackMarkToolStore.getState()).toMatchObject({ placeId: null, speeds: { paddle: null, portage: null } });
    expect(result.current).toMatchObject({ active: false, totalM, marks: NO_MARKS, recommendedPaddleSpeed: null });
    // No boat and no speed: the water time is unknown, never zero.
    expect(result.current.estimate).toMatchObject({
      paddleSpeedKmh: null,
      waterMinutes: null,
      estimateMinutes: 0,
      complete: false,
    });
  });

  it('FE-HOOK-TRACKPADDLE-003: marks a portage from two clicks in either order and a lock from one', () => {
    const { result } = renderPlan();

    act(() => result.current.startPick('portage'));
    act(() => pickOnTrack(9000.4));
    expect(result.current).toMatchObject({ pick: 'portage', pendingFromM: 9000.4, dirty: false });
    expect(result.current.marks.portages).toHaveLength(1);

    act(() => pickOnTrack(7999.6));
    expect(result.current).toMatchObject({ pick: null, pendingFromM: null, dirty: true });
    expect(result.current.marks.portages).toEqual([
      { from_m: 2000, to_m: 3000, extra_minutes: null },
      { from_m: 8000, to_m: 9000, extra_minutes: null },
    ]);
    expect(result.current.layout.stretches.map((stretch) => [stretch.kind, stretch.fromM, stretch.toM])).toEqual([
      ['water', 0, 2000],
      ['portage', 2000, 3000],
      ['water', 3000, 8000],
      ['portage', 8000, 9000],
      ['water', 9000, 12000],
    ]);
    expect(result.current.estimate).toMatchObject({
      waterM: 10000,
      landM: 2000,
      portageCount: 2,
      waterMinutes: 150,
      carryMinutes: 60,
      portageExtraMinutes: 20,
      estimateMinutes: 245,
      complete: true,
    });

    act(() => result.current.startPick('lock'));
    act(() => pickOnTrack(4000.2));
    expect(result.current.pick).toBeNull();
    expect(result.current.marks.locks).toEqual([
      { at_m: 4000, wait_minutes: null, transit_minutes: null },
      { at_m: 6000, wait_minutes: 10, transit_minutes: 5 },
    ]);
    // A lock without its times leaves the estimate incomplete rather than counting it as zero.
    expect(result.current.estimate).toMatchObject({
      locksCounted: 2,
      locksMissingTime: 1,
      lockMinutes: 15,
      estimateMinutes: 245,
      complete: false,
    });

    // A lock inside a portage is carried round: it counts with the portage, not again.
    act(() => result.current.startPick('lock'));
    act(() => pickOnTrack(8500));
    expect(result.current.layout.locks.map((lock) => [lock.atM, lock.bypassed])).toEqual([
      [4000, false],
      [6000, false],
      [8500, true],
    ]);
    expect(result.current.estimate).toMatchObject({ locksCounted: 2, locksMissingTime: 1, estimateMinutes: 245 });
  });

  it('FE-HOOK-TRACKPADDLE-004: a tool pressed again turns off, and a refused click says why', () => {
    const { result } = renderPlan();

    act(() => result.current.startPick('lock'));
    expect(result.current.pick).toBe('lock');
    act(() => result.current.startPick('lock'));
    expect(result.current.pick).toBeNull();

    act(() => result.current.startPick('portage'));
    act(() => pickOnTrack(2200));
    act(() => pickOnTrack(2800));
    expect(result.current).toMatchObject({ pick: 'portage', pendingFromM: null, refused: 'overlap', dirty: false });
    expect(result.current.marks).toEqual(MARKS);

    act(() => refuseTrackPick());
    expect(result.current.refused).toBe('off_line');
    act(() => result.current.startPick('lock'));
    expect(result.current).toMatchObject({ pick: 'lock', refused: null });
  });

  it('FE-HOOK-TRACKPADDLE-005: takes the minutes entered for a portage and a lock, and removes either', () => {
    const { result } = renderPlan();

    act(() => result.current.edits.setPortageExtra(0, 25));
    expect(result.current.marks.portages).toEqual([{ from_m: 2000, to_m: 3000, extra_minutes: 25 }]);
    expect(result.current.dirty).toBe(true);
    expect(result.current.estimate).toMatchObject({ portageExtraMinutes: 25, estimateMinutes: 235 });

    // Zero is a time of its own; cleared, the starting value of 10 minutes applies again.
    act(() => result.current.edits.setPortageExtra(0, 0));
    expect(result.current.estimate).toMatchObject({ portageExtraMinutes: 0, estimateMinutes: 210 });
    act(() => result.current.edits.setPortageExtra(0, null));
    expect(result.current.estimate).toMatchObject({ portageExtraMinutes: 10, estimateMinutes: 220 });

    act(() => result.current.edits.setLock(0, { wait_minutes: null, transit_minutes: 5 }));
    expect(result.current.marks.locks).toEqual([{ at_m: 6000, wait_minutes: null, transit_minutes: 5 }]);
    expect(result.current.estimate).toMatchObject({
      lockMinutes: 5,
      locksMissingTime: 1,
      estimateMinutes: 210,
      complete: false,
    });

    act(() => result.current.edits.setLock(0, null));
    expect(result.current.marks.locks).toEqual([]);
    expect(result.current.estimate).toMatchObject({
      locksCounted: 0,
      lockMinutes: 0,
      estimateMinutes: 205,
      complete: true,
    });

    act(() => result.current.edits.removePortage(0));
    expect(result.current.marks).toEqual(NO_MARKS);
    expect(result.current.layout.stretches).toEqual([
      { kind: 'water', fromM: 0, toM: 12000, extraMinutes: null, startIndex: null },
    ]);
    expect(result.current.estimate).toMatchObject({ portageCount: 0, waterMinutes: 180, estimateMinutes: 180 });
  });

  it('FE-HOOK-TRACKPADDLE-006: reckons with the speeds saved on the tour, then with those entered', () => {
    const saved = paddleTour({ paddle_speed_kmh: 5.5, portage_speed_kmh: 3 });
    const { result } = renderPlan(options({ planner: planner(saved) }));

    expect(result.current.speeds).toEqual({ paddle: 5.5, portage: 3 });
    expect(result.current.estimate).toMatchObject({
      paddleSpeedKmh: 5.5,
      portageSpeedKmh: 3,
      waterMinutes: 120,
      carryMinutes: 20,
      estimateMinutes: 165,
    });

    act(() => result.current.edits.setSpeeds({ paddle: 6 }));
    expect(result.current).toMatchObject({ dirty: true, speeds: { paddle: 6, portage: 3 } });
    expect(result.current.estimate).toMatchObject({ waterMinutes: 110, carryMinutes: 20, estimateMinutes: 155 });

    act(() => result.current.edits.setSpeeds({ portage: 4 }));
    expect(result.current.estimate).toMatchObject({ portageSpeedKmh: 4, carryMinutes: 15, estimateMinutes: 150 });

    // Cleared, the suggested speed of the boat applies again.
    act(() => result.current.edits.setSpeeds({ paddle: null }));
    expect(result.current.speeds).toEqual({ paddle: null, portage: 4 });
    expect(result.current.estimate).toMatchObject({ paddleSpeedKmh: 4, waterMinutes: 165, estimateMinutes: 205 });
  });

  it('FE-HOOK-TRACKPADDLE-007: a boat with no suggested speed leaves the water time open until one is entered', () => {
    const { result } = renderPlan(options({ planner: planner(paddleTour({ boat_type: 'other' })) }));

    expect(result.current.recommendedPaddleSpeed).toBeNull();
    expect(result.current.estimate).toMatchObject({
      paddleSpeedKmh: null,
      waterMinutes: null,
      carryMinutes: 30,
      portageExtraMinutes: 10,
      lockMinutes: 15,
      estimateMinutes: 55,
      complete: false,
    });

    act(() => result.current.edits.setSpeeds({ paddle: 4 }));
    expect(result.current.estimate).toMatchObject({
      paddleSpeedKmh: 4,
      waterMinutes: 165,
      estimateMinutes: 220,
      complete: true,
    });
  });

  it('FE-HOOK-TRACKPADDLE-008: saves through the repo, takes in what came back and hands the tour on', async () => {
    const sent: TrackMarks = {
      portages: [{ from_m: 2000, to_m: 3000, extra_minutes: null }],
      locks: [
        { at_m: 4000, wait_minutes: null, transit_minutes: null },
        { at_m: 6000, wait_minutes: 10, transit_minutes: 5 },
      ],
    };
    const saved = paddleTour({ paddle_speed_kmh: 5, portage_speed_kmh: undefined, track_marks: sent });
    const pending = deferred();
    repo.updatePaddlePlan.mockReturnValueOnce(pending.promise);
    // Whether the store was clean already when the tour was handed on to replace the open one.
    const dirtyWhenHandedOn: boolean[] = [];
    const onSaved = vi.fn<(tour: TourListItem) => void>(() => {
      dirtyWhenHandedOn.push(useTrackMarkToolStore.getState().dirty);
    });
    const { result } = renderPlan(options({ onSaved }));
    act(() => result.current.startPick('lock'));
    act(() => pickOnTrack(4000));
    act(() => result.current.edits.setSpeeds({ paddle: 5 }));

    const saves: Promise<void>[] = [];
    act(() => {
      saves.push(result.current.save());
    });
    expect(result.current.saving).toBe(true);
    // A second press while the first is on its way sends nothing more.
    await act(async () => {
      await result.current.save();
    });
    expect(repo.updatePaddlePlan).toHaveBeenCalledTimes(1);
    expect(repo.updatePaddlePlan).toHaveBeenCalledWith(3, 7, {
      paddle_speed_kmh: 5,
      portage_speed_kmh: null,
      track_marks: sent,
    });

    await act(async () => {
      pending.resolve({ tour: saved, waypoints: [] });
      await Promise.all(saves);
    });

    expect(result.current).toMatchObject({ saving: false, dirty: false, speeds: { paddle: 5, portage: null } });
    expect(result.current.marks).toEqual(sent);
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(dirtyWhenHandedOn).toEqual([false]);
    expect(toast.success).toHaveBeenCalledWith('Portages and locks saved');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-HOOK-TRACKPADDLE-009: with everything removed, the saved tour carries no marks and the store none', async () => {
    const saved = paddleTour({ track_marks: null });
    repo.updatePaddlePlan.mockResolvedValueOnce({ tour: saved, waypoints: [] });
    const onSaved = vi.fn<(tour: TourListItem) => void>();
    const { result } = renderPlan(options({ onSaved }));
    act(() => {
      result.current.edits.removePortage(0);
      result.current.edits.setLock(0, null);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(repo.updatePaddlePlan).toHaveBeenCalledWith(3, 7, {
      paddle_speed_kmh: null,
      portage_speed_kmh: null,
      track_marks: NO_MARKS,
    });
    expect(result.current).toMatchObject({ dirty: false, marks: NO_MARKS });
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it('FE-HOOK-TRACKPADDLE-010: a failed save says so and keeps the unsaved marks to try again', async () => {
    repo.updatePaddlePlan.mockRejectedValueOnce(new Error('offline'));
    const onSaved = vi.fn<(tour: TourListItem) => void>();
    const { result } = renderPlan(options({ onSaved }));
    act(() => result.current.edits.setPortageExtra(0, 20));

    await act(async () => {
      await result.current.save();
    });

    expect(toast.error).toHaveBeenCalledWith('Saving did not work. Please try again.');
    expect(toast.success).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ saving: false, dirty: true });
    expect(result.current.marks.portages).toEqual([{ from_m: 2000, to_m: 3000, extra_minutes: 20 }]);
  });

  it.each<[string, Partial<Options>, boolean]>([
    ['for someone who may not change the tour', { canEdit: false }, true],
    ['with no paddle import open', { planner: planner(null) }, false],
  ])('FE-HOOK-TRACKPADDLE-011: saves nothing %s', async (_label, overrides, active) => {
    const { result } = renderPlan(options(overrides));
    expect(result.current.active).toBe(active);

    await act(async () => {
      await result.current.save();
    });

    expect(repo.updatePaddlePlan).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('FE-HOOK-TRACKPADDLE-012: discarding puts back the marks and speeds the tour was saved with', () => {
    const { result } = renderPlan();
    act(() => {
      result.current.edits.removePortage(0);
      result.current.edits.setSpeeds({ paddle: 6, portage: 3 });
      result.current.startPick('lock');
    });
    expect(result.current).toMatchObject({ dirty: true, pick: 'lock' });

    act(() => result.current.discard());
    expect(result.current).toMatchObject({ dirty: false, pick: null, speeds: { paddle: null, portage: null } });
    expect(result.current.marks).toEqual(MARKS);
    expect(repo.updatePaddlePlan).not.toHaveBeenCalled();
  });

  it('FE-HOOK-TRACKPADDLE-013: with no paddle import open, discarding leaves the shared store alone', () => {
    const { result } = renderPlan(options({ planner: planner(null) }));
    act(() => loadTrackMarks(9, MARKS, { paddle: 5, portage: null }));

    act(() => result.current.discard());
    expect(useTrackMarkToolStore.getState()).toMatchObject({
      placeId: 9,
      marks: MARKS,
      speeds: { paddle: 5, portage: null },
    });
  });

  it('FE-HOOK-TRACKPADDLE-014: the marks follow the open tour when it is saved elsewhere, changed or left', () => {
    const props = options();
    const { result, rerender } = renderPlan(props);
    act(() => result.current.edits.setPortageExtra(0, 30));

    // The same tour, saved from another device meanwhile: its marks replace the unsaved ones.
    rerender({ ...props, planner: planner(paddleTour({ track_marks: null, paddle_speed_kmh: 6 })) });
    expect(result.current).toMatchObject({ active: true, dirty: false, speeds: { paddle: 6, portage: null } });
    expect(result.current.marks).toEqual(NO_MARKS);
    expect(result.current.estimate).toMatchObject({ waterMinutes: 120, estimateMinutes: 120, complete: true });

    // Another import, from a list cached before tours carried their speeds.
    const other = paddleTour({
      place_id: 8,
      boat_type: 'canoe',
      paddle_speed_kmh: undefined,
      portage_speed_kmh: undefined,
      track_marks: { portages: [], locks: [{ at_m: 500, wait_minutes: 5, transit_minutes: 5 }] },
    });
    rerender({ ...props, planner: planner(other, 3) });
    expect(useTrackMarkToolStore.getState().placeId).toBe(8);
    expect(result.current).toMatchObject({ active: true, totalM: 3000, speeds: { paddle: null, portage: null } });
    expect(result.current.estimate).toMatchObject({
      waterMinutes: 45,
      lockMinutes: 10,
      estimateMinutes: 55,
      complete: true,
    });

    // The shared store holding the marks of another tour: the card does not show them as this one's.
    act(() => loadTrackMarks(9, null, { paddle: null, portage: null }));
    expect(result.current.active).toBe(false);

    rerender({ ...props, planner: planner(null) });
    expect(result.current.active).toBe(false);
    expect(useTrackMarkToolStore.getState()).toMatchObject({ placeId: null, marks: NO_MARKS });
  });
});
