/**
 * UPC-001 to UPC-032: the obstacle checklist of the paddle tour open in the
 * tours workspace (PAD-06, PAD-09), as its card and the map share it.
 *
 * Pinned: off for anything but an open paddle tour in an active workspace,
 * new for a paddle tour not saved yet; the checklist read for the bench the
 * list shows, again only when its revision or the connection changes, and an
 * answer for an older revision dropped. A decision shows at once, takes in
 * the server's answer and is undone with a toast when the save fails;
 * deciding waits while the route has unsaved changes and is never offered to
 * someone who may not change the tour. Selecting an entry moves the map onto
 * it, or opens its dialog where the map does not hold it; planning a portage
 * starts the track's own pick or selects the control point to carry from.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleFeature, TourDetailResponse, TourListItem, TripMember } from '@trek/shared';

import { buildUser } from '../../../../tests/helpers/factories';
import {
  earlierEntry,
  obstacleCheck,
  obstacleEntry,
  ownPortage,
  paddleBench,
  ROUTE_BASIS,
  SOURCE_BASIS,
} from '../../../../tests/helpers/paddleCheck';
import { seedStore } from '../../../../tests/helpers/store';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import type { tourRepo } from '../../../repo/tourRepo';
import { useAuthStore } from '../../../store/authStore';
import {
  clearPaddleObstacles,
  publishPaddleObstacles,
  selectPaddleObstacle,
  usePaddleObstacleStore,
} from '../../../store/paddleObstacleStore';
import type { TourPlannerController, TourPlannerWaypoint } from '../planner/useTourPlanner';
import { usePaddleChecklist } from './usePaddleChecklist';

type CheckRead = Awaited<ReturnType<typeof tourRepo.obstacleCheck>>;
type Options = Parameters<typeof usePaddleChecklist>[0];
type TrackPlan = NonNullable<Options['trackPaddlePlan']>;

const repo = vi.hoisted(() => ({
  obstacleCheck: vi.fn<typeof tourRepo.obstacleCheck>(),
  saveObstacleReviews: vi.fn<typeof tourRepo.saveObstacleReviews>(),
}));
const network = vi.hoisted(() => ({ offline: false }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: repo }));
vi.mock('../../../hooks/useNetworkMode', () => ({
  useNetworkMode: () => ({ offline: network.offline, forced: false, setForced: vi.fn() }),
}));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const ENTRY = obstacleEntry();
const CHECK = obstacleCheck({ entries: [ENTRY] });
const BASIS = { route: ROUTE_BASIS, source: SOURCE_BASIS };
const MEMBERS: TripMember[] = [
  { id: 4, username: 'maria' },
  { id: 5, username: 'jonas' },
];

/** A kayak tour of the trip with its bench: the weir of the fixtures still open. */
function paddleTour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 7,
    name: 'Regen from Roding',
    tour_type: 'kayak',
    distance: 5,
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
    paddle_check: paddleBench(),
    ...overrides,
  };
}

const TOUR = paddleTour();

/** Three control points due north, 1112 m apart. */
const WAYPOINTS: TourPlannerWaypoint[] = [
  { id: 'w1', lat: 49.2, lng: 12, role: 'start' },
  { id: 'w2', lat: 49.21, lng: 12, role: 'via' },
  { id: 'w3', lat: 49.22, lng: 12, role: 'end' },
];
const setSelectedWaypointId = vi.fn();

/** The planner with the saved paddle tour open for editing and nothing unsaved, unless told otherwise. */
function planner(overrides: Partial<TourPlannerController> = {}): TourPlannerController {
  const stub: Partial<TourPlannerController> = {
    mode: { type: 'edit-saved', placeId: 7 },
    isPaddle: true,
    hasUnsavedChanges: false,
    waypoints: WAYPOINTS,
    setSelectedWaypointId,
    ...overrides,
  };
  return stub as TourPlannerController;
}

/** The planner with the paddle tour open read-only as a recorded track. */
function recorded(): TourPlannerController {
  return planner({ mode: { type: 'view-gpx', placeId: 7, tour: TOUR } });
}

function trackPlan(overrides: Partial<TrackPlan> = {}): TrackPlan {
  return { dirty: false, pick: null, startPick: vi.fn(), ...overrides };
}

function options(overrides: Partial<Options> = {}): Options {
  return {
    tripId: 3,
    planner: planner(),
    tours: [TOUR],
    tripMembers: MEMBERS,
    canEdit: true,
    active: true,
    onSaved: vi.fn(),
    ...overrides,
  };
}

function renderChecklist(props: Options = options()) {
  return renderHook((current: Options) => usePaddleChecklist(current), {
    initialProps: props,
    wrapper: TranslationProvider,
  });
}

/** Renders the hook and waits for the checklist to be there. */
async function renderReady(props: Options = options()) {
  const view = renderChecklist(props);
  await waitFor(() => expect(view.result.current.status).toBe('ready'));
  return view;
}

/** A read or a save the test answers by hand, so the hook can be read while it is on its way. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** Lets a read the last render started settle inside act. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

/** An object the map holds, at the point of the weir. */
function feature(ref: string): PaddleFeature {
  return {
    ref,
    kind: 'weir',
    group_key: null,
    name: null,
    geometry: { type: 'Point', coordinates: [12.005, 49.2] },
    tags: {},
    tag_hash: ref,
    region_id: 'oberpfalz',
  };
}

/** The objects around the route as the sync hook publishes them. */
function publishMap(refs: string[]) {
  publishPaddleObstacles({
    status: 'ready',
    features: refs.map((ref) => feature(ref)),
    related: [],
    routeLengthM: 5000,
    coverage: 'covered',
    regions: [],
    truncated: false,
  });
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/** Where the camera was last sent, rounded past the floating point of the margin. */
function lastFocus() {
  const current = usePaddleObstacleStore.getState().focus;
  if (!current) return null;
  return { seq: current.seq, points: current.points.map(([lat, lng]) => [round(lat), round(lng)]) };
}

/** The point of the weir framed with the margin of the store, 0.0015 degrees. */
const WEIR_FRAME = [
  [49.1985, 12.0035],
  [49.2015, 12.0065],
];

beforeEach(() => {
  vi.clearAllMocks();
  repo.obstacleCheck.mockReset();
  repo.saveObstacleReviews.mockReset();
  repo.obstacleCheck.mockResolvedValue({ check: CHECK, stale: false });
  network.offline = false;
  clearPaddleObstacles();
  seedStore(useAuthStore, { user: buildUser({ id: 4 }) });
});

describe('usePaddleChecklist: what it reads', () => {
  it('UPC-001: is off for a hike, a neutral planner and a new tour that is no paddle tour, and reads nothing', () => {
    const hike = paddleTour({ tour_type: 'hike', boat_type: null, water_context: null, paddle_check: null });
    const { result, rerender } = renderChecklist(options({ tours: [hike], planner: planner({ isPaddle: false }) }));
    expect(result.current).toMatchObject({ status: 'off', tour: null, check: null, summary: null, canDecide: false });

    rerender(options({ planner: planner({ mode: { type: 'neutral' } }) }));
    expect(result.current).toMatchObject({ status: 'off', tour: null });

    rerender(options({ planner: planner({ mode: { type: 'new-draft' }, isPaddle: false }) }));
    expect(result.current.status).toBe('off');
    expect(repo.obstacleCheck).not.toHaveBeenCalled();
  });

  it('UPC-002: is off while the workspace is not active, and reads once it is', async () => {
    const { result, rerender } = renderChecklist(options({ active: false }));
    expect(result.current).toMatchObject({ status: 'off', check: null, canDecide: false });
    rerender(options({ active: false, planner: planner({ mode: { type: 'new-draft' } }) }));
    expect(result.current.status).toBe('off');
    expect(repo.obstacleCheck).not.toHaveBeenCalled();

    rerender(options());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(repo.obstacleCheck).toHaveBeenCalledTimes(1);
  });

  it('UPC-003: a paddle tour not saved yet is new, with nothing to read', () => {
    const { result } = renderChecklist(options({ planner: planner({ mode: { type: 'new-draft' } }) }));
    expect(result.current).toMatchObject({ status: 'new', tour: null, check: null, summary: null, canDecide: false });
    expect(repo.obstacleCheck).not.toHaveBeenCalled();
  });

  it('UPC-004: loads the checklist for the bench the list shows, then has it ready to decide', async () => {
    const read = deferred<CheckRead>();
    repo.obstacleCheck.mockReturnValueOnce(read.promise);
    const { result } = renderChecklist();
    expect(result.current).toMatchObject({
      status: 'loading',
      tour: TOUR,
      check: null,
      summary: TOUR.paddle_check,
      canDecide: false,
    });
    expect(repo.obstacleCheck).toHaveBeenCalledWith(3, 7, 'rev-1', expect.any(AbortSignal));

    await act(async () => {
      read.resolve({ check: CHECK, stale: false });
      await read.promise;
    });

    expect(result.current).toMatchObject({
      status: 'ready',
      check: CHECK,
      summary: TOUR.paddle_check,
      stale: false,
      dirty: false,
      canDecide: true,
      savingKey: null,
      selectedKey: null,
      dialogKey: null,
    });
  });

  it('UPC-005: a recorded track not in the list yet is read through the tour the planner holds, and a cached answer for an older bench reads as stale', async () => {
    repo.obstacleCheck.mockResolvedValueOnce({ check: CHECK, stale: true });
    const { result } = await renderReady(options({ planner: recorded(), tours: [] }));
    expect(result.current).toMatchObject({ tour: TOUR, check: CHECK, stale: true });
    expect(repo.obstacleCheck).toHaveBeenCalledWith(3, 7, 'rev-1', expect.any(AbortSignal));
  });

  it('UPC-006: offline with nothing cached it says so, and reads again once online', async () => {
    network.offline = true;
    repo.obstacleCheck.mockRejectedValueOnce(new Error('Network Error'));
    const { result, rerender } = renderChecklist();
    await waitFor(() => expect(result.current.status).toBe('offline-empty'));
    expect(result.current).toMatchObject({ check: null, canDecide: false });

    network.offline = false;
    rerender(options());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(repo.obstacleCheck).toHaveBeenCalledTimes(2);
  });

  it('UPC-007: a read that fails online is an error, with nothing to decide', async () => {
    repo.obstacleCheck.mockRejectedValueOnce(new Error('Request failed with status code 500'));
    const { result } = renderChecklist();
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toMatchObject({ check: null, canDecide: false });
  });

  it('UPC-008: reads again only when the bench revision changes', async () => {
    const { result, rerender } = await renderReady();
    rerender(options({ tours: [paddleTour()] }));
    rerender(options({ tours: [paddleTour({ name: 'Regen, renamed' })] }));
    expect(result.current.status).toBe('ready');
    expect(repo.obstacleCheck).toHaveBeenCalledTimes(1);

    const next = obstacleCheck({ revision: 'rev-2' });
    repo.obstacleCheck.mockResolvedValueOnce({ check: next, stale: false });
    rerender(options({ tours: [paddleTour({ paddle_check: paddleBench({ revision: 'rev-2' }) })] }));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.check).toEqual(next));
    expect(repo.obstacleCheck).toHaveBeenCalledTimes(2);
    expect(repo.obstacleCheck).toHaveBeenLastCalledWith(3, 7, 'rev-2', expect.any(AbortSignal));
  });

  it('UPC-009: an answer still on its way for the previous revision is aborted and dropped', async () => {
    const late = deferred<CheckRead>();
    const next = obstacleCheck({ revision: 'rev-2' });
    repo.obstacleCheck.mockReturnValueOnce(late.promise).mockResolvedValueOnce({ check: next, stale: false });
    const { result, rerender } = renderChecklist();
    rerender(options({ tours: [paddleTour({ paddle_check: paddleBench({ revision: 'rev-2' }) })] }));
    await waitFor(() => expect(result.current.check).toEqual(next));
    expect(repo.obstacleCheck.mock.calls[0]?.[3]?.aborted).toBe(true);

    await act(async () => {
      late.resolve({ check: CHECK, stale: false });
      await late.promise;
    });
    expect(result.current.check).toEqual(next);
  });

  it('UPC-010: deciding waits while the route has unsaved changes and is never offered to a viewer', async () => {
    const { result, rerender } = await renderReady();
    expect(result.current.canDecide).toBe(true);

    rerender(options({ planner: planner({ hasUnsavedChanges: true }) }));
    expect(result.current).toMatchObject({ status: 'ready', dirty: true, canDecide: false });

    rerender(options({ planner: recorded(), trackPaddlePlan: trackPlan({ dirty: true }) }));
    expect(result.current).toMatchObject({ status: 'ready', dirty: true, canDecide: false });

    rerender(options({ canEdit: false }));
    expect(result.current).toMatchObject({ status: 'ready', dirty: false, canDecide: false });

    rerender(options());
    expect(result.current.canDecide).toBe(true);
    expect(repo.obstacleCheck).toHaveBeenCalledTimes(1);
  });

  it('UPC-011: a tour made offline and not on the server yet is never decided on', async () => {
    const { result } = await renderReady(
      options({
        planner: planner({ mode: { type: 'edit-saved', placeId: -3 } }),
        tours: [paddleTour({ place_id: -3 })],
      })
    );
    expect(result.current.canDecide).toBe(false);
  });
});

describe('usePaddleChecklist: deciding', () => {
  it('UPC-012: a decision shows at once, then the checklist takes the server answer and the tour is handed on', async () => {
    const save = deferred<TourDetailResponse>();
    repo.saveObstacleReviews.mockReturnValueOnce(save.promise);
    const onSaved = vi.fn<(tour: TourListItem) => void>();
    const { result, rerender } = await renderReady(options({ onSaved }));

    let saving: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saving = result.current.decide(ENTRY, 'pass');
    });

    expect(repo.saveObstacleReviews).toHaveBeenCalledWith(
      3,
      7,
      { ops: [{ key: 'node/1', op: 'decide', decision: 'pass', note: null, basis: BASIS }] },
      4
    );
    expect(result.current).toMatchObject({
      status: 'ready',
      savingKey: 'node/1',
      canDecide: false,
      check: { revision: 'pending' },
    });
    expect(result.current.check?.entries[0]).toMatchObject({
      status: 'decided',
      decision: { decision: 'pass', note: null, decided_by: 4 },
    });
    // The bench counts the decision before the server has it, under the revision the list knows.
    expect(result.current.summary).toEqual(paddleBench({ open: 0, decided: 1 }));
    expect(onSaved).not.toHaveBeenCalled();

    const answered = obstacleCheck({
      revision: 'rev-2',
      entries: [
        obstacleEntry({
          status: 'decided',
          decision: { decision: 'pass', note: null, decided_at: '2026-10-17T09:00:00.000Z', decided_by: 4 },
        }),
      ],
    });
    const savedTour = paddleTour({ paddle_check: paddleBench({ revision: 'rev-2', open: 0, decided: 1 }) });
    await act(async () => {
      save.resolve({ tour: savedTour, waypoints: [], obstacle_check: answered });
      await saving;
    });
    expect(onSaved).toHaveBeenCalledWith(savedTour);
    expect(result.current.savingKey).toBeNull();

    // The workspace takes the saved tour into its list; the answer is the checklist of its new bench.
    repo.obstacleCheck.mockResolvedValue({ check: answered, stale: false });
    rerender(options({ onSaved, tours: [savedTour] }));
    expect(result.current).toMatchObject({
      status: 'ready',
      check: answered,
      summary: savedTour.paddle_check,
      canDecide: true,
    });
    await flush();
    expect(result.current.check).toEqual(answered);
  });

  it('UPC-013: a failed save is undone and says so', async () => {
    const save = deferred<TourDetailResponse>();
    repo.saveObstacleReviews.mockReturnValueOnce(save.promise);
    const onSaved = vi.fn<(tour: TourListItem) => void>();
    const { result } = await renderReady(options({ onSaved }));

    let saving: Promise<boolean> = Promise.resolve(true);
    act(() => {
      saving = result.current.decide(ENTRY, 'portage');
    });
    // Carrying round without a portage planned yet is still to do, so the bench still counts it open.
    expect(result.current.check?.entries[0]).toMatchObject({ status: 'todo', decision: { decision: 'portage' } });
    expect(result.current.summary).toEqual(paddleBench());

    await act(async () => {
      save.reject(new Error('Request failed with status code 409'));
      await saving;
    });
    expect(result.current).toMatchObject({ status: 'ready', savingKey: null, canDecide: true });
    expect(result.current.check).toEqual(CHECK);
    expect(result.current.summary).toEqual(TOUR.paddle_check);
    // The en wording of tours.paddle.marks.failed.
    expect(toast.error).toHaveBeenCalledWith('Saving did not work. Please try again.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('UPC-014: a new choice keeps the note, a note is trimmed and a blank one is none, clear and keep carry no choice', async () => {
    const noted = obstacleEntry({
      status: 'decided',
      decision: { decision: 'pass', note: 'Left bank', decided_at: '2026-10-10T09:00:00.000Z', decided_by: 5 },
    });
    const gone = earlierEntry();
    const listed = obstacleCheck({ entries: [noted, gone] });
    repo.obstacleCheck.mockResolvedValue({ check: listed, stale: false });
    repo.saveObstacleReviews.mockResolvedValue({ tour: TOUR, waypoints: [], obstacle_check: listed });
    const onSaved = vi.fn<(tour: TourListItem) => void>();
    const { result } = await renderReady(options({ onSaved }));

    await act(async () => {
      await result.current.decide(noted, 'portage');
    });
    await act(async () => {
      await result.current.setNote(noted, '  Scout from the left bank  ');
    });
    await act(async () => {
      await result.current.setNote(noted, '   ');
    });
    await act(async () => {
      await result.current.clear(noted);
    });
    await act(async () => {
      await result.current.keep(gone);
    });

    expect(repo.saveObstacleReviews.mock.calls.map(([, , body]) => body.ops)).toEqual([
      [{ key: 'node/1', op: 'decide', decision: 'portage', note: 'Left bank', basis: BASIS }],
      [{ key: 'node/1', op: 'note', decision: null, note: 'Scout from the left bank', basis: null }],
      [{ key: 'node/1', op: 'note', decision: null, note: null, basis: null }],
      [{ key: 'node/1', op: 'clear', decision: null, note: null, basis: null }],
      [{ key: 'node/9', op: 'keep', decision: null, note: null, basis: null }],
    ]);
    expect(onSaved).toHaveBeenCalledTimes(5);
    expect(result.current).toMatchObject({ check: listed, savingKey: null });
  });

  it('UPC-015: nothing is saved, found or offered as next before the checklist is there', async () => {
    repo.obstacleCheck.mockReturnValueOnce(new Promise<CheckRead>(() => undefined));
    const { result } = renderChecklist();
    await act(async () => {
      await result.current.decide(ENTRY, 'pass');
    });
    expect(repo.saveObstacleReviews).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ status: 'loading', savingKey: null });
    expect(result.current.nextOf(ENTRY)).toBeNull();
    expect(result.current.entryForRef('node/1')).toBeNull();
  });

  it('UPC-016: names the trip member who decided, and nobody for an unknown or missing id', () => {
    const { result } = renderChecklist(options({ active: false }));
    expect(result.current.memberName(4)).toBe('maria');
    expect(result.current.memberName(5)).toBe('jonas');
    expect(result.current.memberName(9)).toBeNull();
    expect(result.current.memberName(null)).toBeNull();
  });
});

describe('usePaddleChecklist: the map and the route', () => {
  it('UPC-017: selecting an entry the map holds selects it there and moves the camera onto it', async () => {
    const { result } = await renderReady();
    act(() => publishMap(['node/1']));
    act(() => result.current.select(ENTRY));
    expect(usePaddleObstacleStore.getState().selectedRef).toBe('node/1');
    expect(lastFocus()).toEqual({ seq: 1, points: WEIR_FRAME });
    expect(result.current).toMatchObject({ selectedKey: 'node/1', dialogKey: null });
  });

  it('UPC-018: a selection on the map marks the entry that stands for the object, a lock by any of its parts', async () => {
    const lock = obstacleEntry({
      key: 'lock:node/5',
      refs: ['node/6', 'node/5'],
      kind: 'lock',
      name: 'Schleuse Roding',
      along_m: 2400,
    });
    repo.obstacleCheck.mockResolvedValue({ check: obstacleCheck({ entries: [ENTRY, lock] }), stale: false });
    const { result } = await renderReady();
    expect(result.current.entryForRef('node/5')).toEqual(lock);
    expect(result.current.entryForRef('node/42')).toBeNull();

    act(() => selectPaddleObstacle('node/5'));
    expect(result.current.selectedKey).toBe('lock:node/5');
    act(() => selectPaddleObstacle('node/42'));
    expect(result.current.selectedKey).toBeNull();
    // A click on the map only selects; the camera stays where it is.
    expect(lastFocus()).toBeNull();
  });

  it('UPC-019: selecting an entry the map does not hold frames its area and opens its dialog', async () => {
    const { result } = await renderReady();
    act(() => selectPaddleObstacle('node/77'));
    act(() => result.current.select(ENTRY));
    expect(usePaddleObstacleStore.getState().selectedRef).toBeNull();
    expect(lastFocus()).toEqual({ seq: 1, points: WEIR_FRAME });
    expect(result.current).toMatchObject({ dialogKey: 'node/1', selectedKey: 'node/1' });

    act(() => result.current.closeDialog());
    expect(result.current).toMatchObject({ dialogKey: null, selectedKey: null });

    // Once the map holds it, selecting it goes through the map and closes the dialog.
    act(() => result.current.select(ENTRY));
    act(() => publishMap(['node/1']));
    act(() => result.current.select(ENTRY));
    expect(result.current).toMatchObject({ dialogKey: null, selectedKey: 'node/1' });
    expect(lastFocus()?.seq).toBe(3);
  });

  it('UPC-020: next selects the next entry along the route still asking for a look', async () => {
    const decision = { decision: 'pass' as const, note: null, decided_at: '2026-10-10T09:00:00.000Z', decided_by: 5 };
    const dam = obstacleEntry({
      key: 'node/2',
      refs: ['node/2'],
      kind: 'dam',
      along_m: 2500,
      status: 'decided',
      decision,
    });
    const rapids = obstacleEntry({
      key: 'node/3',
      refs: ['node/3'],
      kind: 'rapids',
      along_m: 4000,
      status: 'review',
      changed: ['source'],
      decision,
    });
    repo.obstacleCheck.mockResolvedValue({ check: obstacleCheck({ entries: [ENTRY, dam, rapids] }), stale: false });
    const { result } = await renderReady();
    expect(result.current.nextOf(ENTRY)).toEqual(rapids);

    act(() => result.current.next(ENTRY));
    expect(result.current).toMatchObject({ dialogKey: 'node/3', selectedKey: 'node/3' });

    // After the last one there is none, and nothing moves.
    expect(result.current.nextOf(rapids)).toBeNull();
    act(() => result.current.next(rapids));
    expect(result.current.dialogKey).toBe('node/3');
    expect(lastFocus()?.seq).toBe(1);
  });

  it('UPC-021: planning a portage on a recorded track starts the portage pick of the track, once', async () => {
    const plan = trackPlan();
    const { result, rerender } = await renderReady(options({ planner: recorded(), trackPaddlePlan: plan }));
    act(() => publishMap(['node/1']));
    act(() => result.current.select(ENTRY));

    act(() => result.current.planPortage(ENTRY));
    expect(plan.startPick).toHaveBeenCalledWith('portage');
    expect(usePaddleObstacleStore.getState().selectedRef).toBeNull();
    expect(lastFocus()).toEqual({ seq: 2, points: WEIR_FRAME });
    expect(result.current.dialogKey).toBeNull();
    expect(setSelectedWaypointId).not.toHaveBeenCalled();

    // While the pick is on, a second press leaves it on rather than switching it off.
    const picking = trackPlan({ pick: 'portage' });
    rerender(options({ planner: recorded(), trackPaddlePlan: picking }));
    act(() => result.current.planPortage(ENTRY));
    expect(picking.startPick).not.toHaveBeenCalled();
  });

  it('UPC-022: planning a portage on a planned tour selects the control point whose leg passes the obstacle', async () => {
    const plan = trackPlan();
    const { result, rerender } = await renderReady(options({ trackPaddlePlan: plan }));
    act(() => result.current.select(ENTRY));
    expect(result.current.dialogKey).toBe('node/1');

    act(() => result.current.planPortage(ENTRY));
    expect(setSelectedWaypointId).toHaveBeenLastCalledWith('w2');
    expect(result.current.dialogKey).toBeNull();
    expect(lastFocus()).toEqual({ seq: 2, points: WEIR_FRAME });
    expect(plan.startPick).not.toHaveBeenCalled();

    act(() => result.current.planPortage(obstacleEntry({ along_m: 500 })));
    expect(setSelectedWaypointId).toHaveBeenLastCalledWith('w1');
    // Past the last control point the portage starts on the last leg.
    act(() => result.current.planPortage(obstacleEntry({ along_m: 9000 })));
    expect(setSelectedWaypointId).toHaveBeenLastCalledWith('w2');

    // A route of one point has no leg to carry from.
    rerender(options({ planner: planner({ waypoints: WAYPOINTS.slice(0, 1) }), trackPaddlePlan: plan }));
    act(() => result.current.planPortage(ENTRY));
    expect(setSelectedWaypointId).toHaveBeenCalledTimes(3);
  });

  it('UPC-023: selecting an own portage frames it, and on a planned tour selects its control point', async () => {
    const { result, rerender } = await renderReady();
    act(() => result.current.selectOwn(ownPortage()));
    expect(lastFocus()).toEqual({
      seq: 1,
      points: [
        [49.1985, 12.003],
        [49.2016, 12.0073],
      ],
    });
    expect(setSelectedWaypointId).toHaveBeenCalledWith('w2');

    // A portage laid onto a recorded track belongs to no control point.
    rerender(options({ planner: recorded() }));
    act(() => result.current.selectOwn(ownPortage({ index: null })));
    expect(lastFocus()?.seq).toBe(2);
    expect(setSelectedWaypointId).toHaveBeenCalledTimes(1);
  });
});

describe('usePaddleChecklist after review', () => {
  const answer = (check: typeof CHECK, revision: string, place = 7): TourDetailResponse => ({
    tour: paddleTour({ place_id: place, paddle_check: paddleBench({ revision }) }),
    waypoints: [],
    obstacle_check: check,
  });

  it('UPC-024: a save answered after another tour opened leaves that tour as it read itself', async () => {
    const other = paddleTour({ place_id: 8, paddle_check: paddleBench({ revision: 'rev-8' }) });
    const save = deferred<TourDetailResponse>();
    repo.saveObstacleReviews.mockReturnValueOnce(save.promise);
    const props = options({ tours: [TOUR, other] });
    const { result, rerender } = await renderReady(props);
    act(() => {
      void result.current.decide(ENTRY, 'pass');
    });
    const otherCheck = obstacleCheck({
      revision: 'rev-8',
      entries: [obstacleEntry({ key: 'node/8', refs: ['node/8'] })],
    });
    repo.obstacleCheck.mockResolvedValue({ check: otherCheck, stale: false });
    rerender({ ...props, planner: planner({ mode: { type: 'edit-saved', placeId: 8 } }) });
    await waitFor(() => expect(result.current.check?.entries[0]?.key).toBe('node/8'));
    expect(result.current.savingKey).toBeNull();

    await act(async () => {
      save.resolve(
        answer(obstacleCheck({ revision: 'rev-2', entries: [obstacleEntry({ status: 'decided' })] }), 'rev-2')
      );
      await save.promise;
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.check?.entries[0]?.key).toBe('node/8');
    expect(props.onSaved).toHaveBeenCalledWith(expect.objectContaining({ place_id: 7 }));
  });

  it('UPC-025: a save whose checklist is of another revision than its bench stays marked stale', async () => {
    const { result, rerender } = await renderReady();
    repo.saveObstacleReviews.mockResolvedValueOnce(answer(obstacleCheck({ revision: 'rev-1' }), 'local:u1'));
    await act(async () => {
      await result.current.decide(ENTRY, 'pass');
    });
    rerender(options({ tours: [paddleTour({ paddle_check: paddleBench({ revision: 'local:u1' }) })] }));
    expect(result.current.stale).toBe(true);
  });

  it('UPC-026: a read that finds a newer bench on the server hands the tour on and is not stale', async () => {
    const newer = paddleTour({ paddle_check: paddleBench({ revision: 'rev-9' }) });
    repo.obstacleCheck.mockResolvedValue({ check: obstacleCheck({ revision: 'rev-9' }), stale: true, tour: newer });
    const props = options({ tours: [paddleTour({ paddle_check: paddleBench({ revision: 'local:u1' }) })] });
    const { result, rerender } = renderChecklist(props);
    await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith(newer));
    rerender({ ...props, tours: [newer] });
    expect(result.current).toMatchObject({ status: 'ready', stale: false });
  });

  it('UPC-027: while the same tour reads again its last checklist stays, locked', async () => {
    const { result, rerender } = await renderReady();
    const again = deferred<CheckRead>();
    repo.obstacleCheck.mockReturnValueOnce(again.promise);
    rerender(options({ tours: [paddleTour({ paddle_check: paddleBench({ revision: 'rev-3' }) })] }));
    expect(result.current.status).toBe('loading');
    expect(result.current.check).toEqual(CHECK);
    expect(result.current.canDecide).toBe(false);
    await act(async () => {
      again.resolve({ check: obstacleCheck({ revision: 'rev-3' }), stale: false });
      await again.promise;
    });
    expect(result.current.status).toBe('ready');
  });

  it('UPC-028: a saved tour turned into a paddle tour and not saved yet asks to be saved first', () => {
    const hike = paddleTour({ tour_type: 'hike', boat_type: null, water_context: null, paddle_check: null });
    const { result } = renderChecklist(options({ tours: [hike], planner: planner({ isPaddle: true }) }));
    expect(result.current).toMatchObject({ status: 'new', tour: null, canDecide: false });
    expect(repo.obstacleCheck).not.toHaveBeenCalled();
  });

  it('UPC-029: planning a portage is offered to editors only', async () => {
    expect((await renderReady()).result.current.canPlanPortage).toBe(true);
    expect((await renderReady(options({ canEdit: false }))).result.current.canPlanPortage).toBe(false);
  });

  it('UPC-030: a note whose save failed answers false, one that went through true', async () => {
    const { result } = await renderReady();
    repo.saveObstacleReviews.mockRejectedValueOnce(new Error('offline'));
    let saved: boolean | undefined;
    await act(async () => {
      saved = await result.current.setNote(ENTRY, 'Links');
    });
    expect(saved).toBe(false);
    repo.saveObstacleReviews.mockResolvedValueOnce(answer(CHECK, 'rev-1'));
    await act(async () => {
      saved = await result.current.setNote(ENTRY, 'Links');
    });
    expect(saved).toBe(true);
  });

  it('UPC-031: a save on one tour and then on another keep their own pending state until each is answered', async () => {
    const other = paddleTour({ place_id: 8, paddle_check: paddleBench({ revision: 'rev-8' }) });
    const otherEntry = obstacleEntry({ key: 'node/8', refs: ['node/8'] });
    const first = deferred<TourDetailResponse>();
    const second = deferred<TourDetailResponse>();
    repo.saveObstacleReviews.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const props = options({ tours: [TOUR, other] });
    const { result, rerender } = await renderReady(props);
    act(() => {
      void result.current.decide(ENTRY, 'pass');
    });
    repo.obstacleCheck.mockResolvedValue({
      check: obstacleCheck({ revision: 'rev-8', entries: [otherEntry] }),
      stale: false,
    });
    rerender({ ...props, planner: planner({ mode: { type: 'edit-saved', placeId: 8 } }) });
    await waitFor(() => expect(result.current.check?.entries[0]?.key).toBe('node/8'));
    act(() => {
      void result.current.decide(otherEntry, 'portage');
    });
    expect(result.current.savingKey).toBe('node/8');

    await act(async () => {
      first.resolve(answer(obstacleCheck({ revision: 'rev-2' }), 'rev-2'));
      await first.promise;
    });
    expect(result.current.savingKey).toBe('node/8');
    expect(result.current.check?.entries[0]).toMatchObject({ key: 'node/8', decision: { decision: 'portage' } });
  });

  it('UPC-032: a saved paddle tour the list has not loaded yet is off until it is there, then read', async () => {
    const { result, rerender } = renderChecklist(options({ tours: [] }));
    expect(result.current.status).toBe('off');
    expect(repo.obstacleCheck).not.toHaveBeenCalled();
    rerender(options());
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
