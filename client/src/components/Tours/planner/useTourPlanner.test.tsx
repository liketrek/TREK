// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';

vi.mock('../../../../../server/src/config', () => {
  throw new Error('Config initialization is forbidden in client tests');
});
vi.mock('../../../../../server/src/db/database', () => {
  throw new Error('Legacy database imports are forbidden in client tests');
});
vi.mock('../../../../../server/src/nest/database/database.service', () => {
  throw new Error('Database service imports are forbidden in client tests');
});
vi.mock('better-sqlite3', () => {
  throw new Error('SQLite imports are forbidden in client tests');
});

const { routeWalkingTour, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(() => ({
  routeWalkingTour: vi.fn(),
  enrichTourElevations: vi.fn(),
  createTour: vi.fn(),
  detailTour: vi.fn(),
  updateTour: vi.fn(),
}));

vi.mock('./tourRouting', () => ({ routeWalkingTour, enrichTourElevations }));
vi.mock('../../../api/client', () => ({ toursApi: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../useTourPermissions', () => ({
  useTourPermissions: ({ canEdit = true, canAssign = true }: { canEdit?: boolean; canAssign?: boolean }) => ({
    canEdit,
    canAssign,
  }),
}));

import { TourPlannerRail } from './TourPlannerPanels';
import { useTourPlanner } from './useTourPlanner';

const routed = {
  coordinates: [
    [48, 11],
    [48.01, 11.02],
  ] as [number, number][],
  distanceMeters: 2200,
  durationSeconds: 1800,
};
const enriched = [
  [48, 11, 500],
  [48.01, 11.02, 550],
] as [number, number, number][];
const savedTour = {
  place_id: 42,
  name: 'Saved ridge',
  tour_type: 'hike' as const,
  distance: 2.2,
  elevation_gain: 50,
  elevation_loss: 0,
  duration: 30,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  tour_group_id: null,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('useTourPlanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    enrichTourElevations.mockReset().mockResolvedValue(enriched);
    createTour.mockReset();
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('TOUR-PLANNER-001: normalizes roles and stores settled waypoint undo/redo snapshots', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 7 }));
    act(() => result.current.addWaypoint(48, 11));
    const firstId = result.current.waypoints[0].id;
    act(() => result.current.addWaypoint(49, 12));

    expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'end']);
    act(() => result.current.addWaypoint(50, 13));
    expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'via', 'end']);

    act(() => result.current.undo());
    expect(result.current.waypoints).toHaveLength(2);
    expect(result.current.waypoints[0].id).toBe(firstId);
    act(() => result.current.redo());
    expect(result.current.waypoints).toHaveLength(3);
  });

  it('changes the map focus intent only for explicit Tour context changes', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    const { result } = renderHook(() => useTourPlanner({ tripId: 8 }));
    const initialFocusKey = result.current.mapFocusKey;

    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.mapFocusKey).toBe(initialFocusKey);

    act(() => result.current.retry());
    expect(result.current.mapFocusKey).toBe(initialFocusKey);

    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(true);
    });
    expect(result.current.mapFocusKey).toBe(initialFocusKey + 1);
    act(() => result.current.addWaypoint(48.02, 11.03));
    expect(result.current.mapFocusKey).toBe(initialFocusKey + 1);

    act(() => result.current.viewGpxTour({ ...savedTour, has_waypoints: false }, '[[48,11],[48.01,11.02]]'));
    expect(result.current.mapFocusKey).toBe(initialFocusKey + 2);
  });

  it('TOUR-PLANNER-002: restores a trip-scoped local draft without changing stable ids', () => {
    localStorage.setItem(
      'tour-draft-8',
      JSON.stringify({
        version: 1,
        name: 'Recovered ridge',
        waypoints: [
          { id: 'stable-a', lat: 48, lng: 11, role: 'via' },
          { id: 'stable-b', lat: 49, lng: 12, role: 'via' },
        ],
      })
    );

    const { result } = renderHook(() => useTourPlanner({ tripId: 8 }));
    expect(result.current.name).toBe('Recovered ridge');
    expect(result.current.waypoints.map((point) => [point.id, point.role])).toEqual([
      ['stable-a', 'start'],
      ['stable-b', 'end'],
    ]);
  });

  it('TOUR-PLANNER-003: cancels and rejects a stale route response after a waypoint edit', async () => {
    const first = deferred<typeof routed | null>();
    routeWalkingTour.mockReturnValueOnce(first.promise).mockResolvedValueOnce({
      ...routed,
      coordinates: [
        [50, 13],
        [51, 14],
      ],
    });
    enrichTourElevations.mockResolvedValue([
      [50, 13, 700],
      [51, 14, 710],
    ]);
    const { result } = renderHook(() => useTourPlanner({ tripId: 9 }));

    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(49, 12);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.status).toBe('routing');

    act(() => result.current.addWaypoint(50, 13));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.route).toEqual([
      [50, 13],
      [51, 14],
    ]);

    await act(async () => {
      first.resolve(routed);
      await Promise.resolve();
    });
    expect(result.current.route).toEqual([
      [50, 13],
      [51, 14],
    ]);
  });

  it('TOUR-PLANNER-004: saves only the full elevation-enriched route and clears the draft', async () => {
    createTour.mockResolvedValue({ tour: { place_id: 42 }, waypoints: [] });
    const { result } = renderHook(() => useTourPlanner({ tripId: 10 }));
    act(() => {
      result.current.setName('Summit loop');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(result.current.canSave).toBe(true);
    expect(result.current.routeAnalysis?.minEle).toBe(500);
    expect(result.current.routeAnalysis?.maxEle).toBe(550);
    expect(result.current.routeAnalysis?.gain).toBe(50);
    expect(result.current.routeAnalysis?.distanceIndexedProfileSamples).toHaveLength(2);
    await act(async () => {
      await result.current.save();
    });
    expect(createTour).toHaveBeenCalledWith(10, expect.objectContaining({ route_geometry: enriched }));
    expect(localStorage.getItem('tour-draft-10')).toBeNull();
    expect(result.current.status).toBe('saved');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('keeps a partially enriched route usable but unavailable for profile metrics and saving', async () => {
    enrichTourElevations.mockResolvedValue([
      [48, 11, 0],
      [48.01, 11.02],
    ]);
    const { result } = renderHook(() => useTourPlanner({ tripId: 100 }));
    act(() => {
      result.current.setName('Partial elevation ridge');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(result.current.status).toBe('elevation-failed');
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.enrichedGeometry).toEqual([
      [48, 11, 0],
      [48.01, 11.02],
    ]);
    expect(result.current.routeAnalysis?.distanceKm).toBeGreaterThan(0);
    expect(result.current.routeAnalysis).toMatchObject({
      minEle: null,
      maxEle: null,
      gain: null,
      loss: null,
      distanceIndexedProfileSamples: [],
    });
    expect(result.current.canSave).toBe(false);
    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });
    expect(createTour).not.toHaveBeenCalled();
  });

  it('does not mark a reopened editable Tour ready when re-enrichment has missing samples', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    enrichTourElevations.mockResolvedValue([
      [48, 11, 0],
      [48.01, 11.02],
    ]);
    const { result } = renderHook(() => useTourPlanner({ tripId: 1001 }));

    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: savedTour.place_id });
    expect(result.current.status).toBe('elevation-failed');
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.routeAnalysis).toMatchObject({ gain: null, loss: null, minEle: null, maxEle: null });
    expect(result.current.canSave).toBe(false);
    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });
    expect(updateTour).not.toHaveBeenCalled();
  });

  it('finalizes only the submitted revision and preserves edits made while its request is pending', async () => {
    const pending = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    createTour.mockReturnValue(pending.promise);
    const onSaved = vi.fn();
    const { result } = renderHook(() => useTourPlanner({ tripId: 101, onSaved }));
    act(() => {
      result.current.setName('Submitted ridge');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    let savePromise!: Promise<unknown>;
    act(() => {
      savePromise = result.current.save();
    });
    expect(result.current.isSaving).toBe(true);

    act(() => result.current.setName('Newer ridge edit'));
    expect(result.current.name).toBe('Newer ridge edit');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.canUndo).toBe(true);
    expect(JSON.parse(localStorage.getItem('tour-draft-101') || 'null')).toMatchObject({ name: 'Newer ridge edit' });

    await act(async () => {
      pending.resolve({ tour: { ...savedTour, name: 'Submitted ridge' }, waypoints: [] });
      await savePromise;
    });

    expect(result.current.name).toBe('Newer ridge edit');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.saveOutcome).toBeNull();
    expect(localStorage.getItem('tour-draft-101')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('tour-draft-101') || 'null')).toMatchObject({ name: 'Newer ridge edit' });
    expect(onSaved).toHaveBeenCalledOnce();
    expect(result.current.isSaving).toBe(false);
  });

  it('does not start overlapping Saves and prevents context replacement while saving', async () => {
    const pending = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    createTour.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useTourPlanner({ tripId: 102 }));
    act(() => {
      result.current.setName('Single request');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    let firstSave!: Promise<unknown>;
    let secondSave!: Promise<unknown>;
    act(() => {
      firstSave = result.current.save();
      secondSave = result.current.save();
    });
    expect(createTour).toHaveBeenCalledOnce();
    expect(result.current.isSaving).toBe(true);
    act(() => {
      result.current.startNewTour(true);
      result.current.returnToNeutral();
      result.current.viewGpxTour({ ...savedTour, has_waypoints: false }, '[[48,11],[48.01,11.02]]');
    });
    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(false);
    });
    expect(result.current.name).toBe('Single request');
    expect(result.current.mode).toEqual({ type: 'new-draft' });

    await act(async () => {
      pending.resolve({ tour: { ...savedTour, name: 'Single request' }, waypoints: [] });
      await Promise.all([firstSave, secondSave]);
    });
    expect(createTour).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('saved');
  });

  it('ignores an old Save failure after a newer draft revision exists', async () => {
    const pending = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    createTour.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useTourPlanner({ tripId: 103 }));
    act(() => {
      result.current.setName('Submitted name');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    let savePromise!: Promise<unknown>;
    act(() => {
      savePromise = result.current.save();
    });
    act(() => result.current.setName('Latest name'));

    await act(async () => {
      pending.reject(new Error('old request failed'));
      await savePromise;
    });

    expect(result.current.name).toBe('Latest name');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('ready');
    expect(JSON.parse(localStorage.getItem('tour-draft-103') || 'null')).toMatchObject({ name: 'Latest name' });
    expect(result.current.isSaving).toBe(false);
  });

  it('does not finalize a pending Save after unmount', async () => {
    const pending = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    createTour.mockReturnValue(pending.promise);
    const onSaved = vi.fn();
    const { result, unmount } = renderHook(() => useTourPlanner({ tripId: 104, onSaved }));
    act(() => {
      result.current.setName('Unmounting save');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    let savePromise!: Promise<unknown>;
    act(() => {
      savePromise = result.current.save();
    });
    unmount();

    await act(async () => {
      pending.resolve({ tour: { ...savedTour, name: 'Unmounting save' }, waypoints: [] });
      await savePromise;
    });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('TOUR-PLANNER-005: keeps the Tours base layer in per-view planner state', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 11 }));

    expect(result.current.mapBaseLayer).toBe('default');
    act(() => result.current.setMapBaseLayer('topo'));
    expect(result.current.mapBaseLayer).toBe('topo');
    act(() => result.current.setMapBaseLayer('satellite'));
    expect(result.current.mapBaseLayer).toBe('satellite');
  });

  it('TOUR-PLANNER-006: opens persisted controls from a saved tour and re-routes them', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    const { result } = renderHook(() => useTourPlanner({ tripId: 12 }));

    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(true);
    });

    expect(detailTour).toHaveBeenCalledWith(12, 42, expect.any(AbortSignal));
    expect(result.current.editingPlaceId).toBe(42);
    expect(result.current.name).toBe('Saved ridge');
    expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'end']);
    expect(result.current.hasUnsavedChanges).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(routeWalkingTour).toHaveBeenCalledWith(result.current.waypoints, expect.any(AbortSignal), 2);
    expect(result.current.status).toBe('ready');
    expect(result.current.route).toEqual(routed.coordinates);

    act(() => result.current.removeWaypoint(result.current.waypoints[1].id));
    expect(result.current.editingPlaceId).toBe(savedTour.place_id);
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.waypoints).toHaveLength(1);
    expect(result.current.route).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.canSave).toBe(false);
  });

  it('TOUR-PLANNER-007: saves edits back to the opened tour and retains edit identity', async () => {
    const detail = {
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    detailTour.mockResolvedValue(detail);
    updateTour.mockResolvedValue({ ...detail, tour: { ...savedTour, name: 'Edited ridge' } });
    const { result } = renderHook(() => useTourPlanner({ tripId: 13 }));
    await act(async () => {
      await result.current.openTour(savedTour);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    act(() => result.current.setName('Edited ridge'));

    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });

    expect(updateTour).toHaveBeenCalledWith(13, 42, expect.objectContaining({ name: 'Edited ridge' }));
    expect(createTour).not.toHaveBeenCalled();
    expect(result.current.saveOutcome).toMatchObject({ place_id: 42, name: 'Edited ridge' });
    expect(result.current.editingPlaceId).toBe(42);
  });

  it('keeps the newest Tour detail when requests resolve out of order', async () => {
    const first = deferred<{
      tour: typeof savedTour;
      waypoints: { lat: number; lng: number; role: 'start' | 'end'; sequence: number }[];
    }>();
    const second =
      deferred<
        typeof first extends never
          ? never
          : {
              tour: typeof savedTour;
              waypoints: { lat: number; lng: number; role: 'start' | 'end'; sequence: number }[];
            }
      >();
    detailTour.mockImplementation((_tripId: number, placeId: number) =>
      placeId === 42 ? first.promise : second.promise
    );
    const { result } = renderHook(() => useTourPlanner({ tripId: 130 }));
    const otherTour = { ...savedTour, place_id: 43, name: 'North ridge' };

    let openFirst!: Promise<boolean>;
    let openSecond!: Promise<boolean>;
    act(() => {
      openFirst = result.current.openTour(savedTour);
      openSecond = result.current.openTour(otherTour);
    });
    const firstSignal = detailTour.mock.calls[0][2] as AbortSignal;
    expect(firstSignal.aborted).toBe(true);
    expect(result.current.openingTourId).toBe(43);

    await act(async () => {
      second.resolve({
        tour: otherTour,
        waypoints: [
          { lat: 50, lng: 13, role: 'start', sequence: 0 },
          { lat: 50.01, lng: 13.02, role: 'end', sequence: 1 },
        ],
      });
      expect(await openSecond).toBe(true);
    });
    await act(async () => {
      first.resolve({
        tour: savedTour,
        waypoints: [
          { lat: 48, lng: 11, role: 'start', sequence: 0 },
          { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
        ],
      });
      expect(await openFirst).toBe(false);
    });

    expect(result.current.editingPlaceId).toBe(43);
    expect(result.current.name).toBe('North ridge');
    expect(result.current.waypoints.map((point) => point.lat)).toEqual([50, 50.01]);
    expect(result.current.openingTourId).toBeNull();
  });

  it('does not let pending detail replace a GPX view or a newly started draft', async () => {
    const gpxRequest = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockReturnValueOnce(gpxRequest.promise);
    const gpxPlanner = renderHook(() => useTourPlanner({ tripId: 131 }));
    let openGpxRequest!: Promise<boolean>;
    act(() => {
      openGpxRequest = gpxPlanner.result.current.openTour(savedTour);
    });
    const gpxSignal = detailTour.mock.calls[0][2] as AbortSignal;
    act(() =>
      gpxPlanner.result.current.viewGpxTour(
        { ...savedTour, place_id: 44, has_waypoints: false },
        '[[35,139],[35.1,139.1]]'
      )
    );
    expect(gpxSignal.aborted).toBe(true);
    await act(async () => {
      gpxRequest.resolve({ tour: savedTour, waypoints: [] });
      expect(await openGpxRequest).toBe(false);
    });
    expect(gpxPlanner.result.current.mode.type).toBe('view-gpx');
    expect(gpxPlanner.result.current.mode.type === 'view-gpx' && gpxPlanner.result.current.mode.placeId).toBe(44);

    const draftRequest = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockReturnValueOnce(draftRequest.promise);
    const draftPlanner = renderHook(() => useTourPlanner({ tripId: 132 }));
    let openDraftRequest!: Promise<boolean>;
    act(() => {
      openDraftRequest = draftPlanner.result.current.openTour(savedTour);
    });
    act(() => draftPlanner.result.current.startNewTour());
    const draftRecovery = localStorage.getItem('tour-draft-132');
    await act(async () => {
      draftRequest.resolve({ tour: savedTour, waypoints: [] });
      expect(await openDraftRequest).toBe(false);
    });
    expect(draftPlanner.result.current.mode).toEqual({ type: 'new-draft' });
    expect(localStorage.getItem('tour-draft-132')).toBe(draftRecovery);
    expect(draftPlanner.result.current.editingPlaceId).toBeNull();
  });

  it('ignores detail completion after trip change, Planner close, or unmount', async () => {
    const tripRequest = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockReturnValueOnce(tripRequest.promise);
    const tripPlanner = renderHook(({ tripId }) => useTourPlanner({ tripId }), { initialProps: { tripId: 133 } });
    let openTripRequest!: Promise<boolean>;
    act(() => {
      openTripRequest = tripPlanner.result.current.openTour(savedTour);
    });
    tripPlanner.rerender({ tripId: 134 });
    await act(async () => {
      tripRequest.resolve({ tour: savedTour, waypoints: [] });
      expect(await openTripRequest).toBe(false);
    });
    expect(tripPlanner.result.current.editingPlaceId).toBeNull();

    const closeRequest = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockReturnValueOnce(closeRequest.promise);
    const closingPlanner = renderHook(({ active }) => useTourPlanner({ tripId: 135, active }), {
      initialProps: { active: true },
    });
    let openCloseRequest!: Promise<boolean>;
    act(() => {
      openCloseRequest = closingPlanner.result.current.openTour(savedTour);
    });
    const closeSignal = detailTour.mock.calls[detailTour.mock.calls.length - 1][2] as AbortSignal;
    closingPlanner.rerender({ active: false });
    expect(closeSignal.aborted).toBe(true);
    await act(async () => {
      closeRequest.resolve({ tour: savedTour, waypoints: [] });
      expect(await openCloseRequest).toBe(false);
    });
    expect(closingPlanner.result.current.editingPlaceId).toBeNull();

    const unmountRequest = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockReturnValueOnce(unmountRequest.promise);
    const unmountPlanner = renderHook(() => useTourPlanner({ tripId: 136 }));
    let openUnmountRequest!: Promise<boolean>;
    act(() => {
      openUnmountRequest = unmountPlanner.result.current.openTour(savedTour);
    });
    const unmountSignal = detailTour.mock.calls[detailTour.mock.calls.length - 1][2] as AbortSignal;
    unmountPlanner.unmount();
    expect(unmountSignal.aborted).toBe(true);
    await act(async () => {
      unmountRequest.resolve({ tour: savedTour, waypoints: [] });
      expect(await openUnmountRequest).toBe(false);
    });
  });

  it('ignores stale failure and finalization while preserving current request loading', async () => {
    const first = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    const second = deferred<{ tour: typeof savedTour; waypoints: [] }>();
    detailTour.mockImplementation((_tripId: number, placeId: number) =>
      placeId === 42 ? first.promise : second.promise
    );
    const { result } = renderHook(() => useTourPlanner({ tripId: 137 }));
    const otherTour = { ...savedTour, place_id: 43, name: 'Other ridge' };
    let openFirst!: Promise<boolean>;
    let openSecond!: Promise<boolean>;
    act(() => {
      openFirst = result.current.openTour(savedTour);
      openSecond = result.current.openTour(otherTour);
    });

    await act(async () => {
      first.reject(new Error('stale detail failed'));
      expect(await openFirst).toBe(false);
    });
    expect(result.current.openingTourId).toBe(43);
    expect(result.current.error).toBeNull();

    await act(async () => {
      second.resolve({ tour: otherTour, waypoints: [] });
      expect(await openSecond).toBe(false);
    });
    expect(result.current.error).toBe('open');
    expect(result.current.openingTourId).toBeNull();

    detailTour.mockRejectedValueOnce(new Error('current detail failed'));
    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(false);
    });
    expect(result.current.error).toBe('open');
    expect(result.current.openingTourId).toBeNull();
  });

  it('TOUR-PLANNER-008: views GPX geometry read-only and clears editor state', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 14 }));
    act(() => {
      result.current.setName('Unsaved planner draft');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    const waypoints = result.current.waypoints;
    const geometry = JSON.stringify([
      [48, 11, 500],
      [48.01, 11.02, 550],
    ]);

    act(() => result.current.viewGpxTour({ ...savedTour, has_waypoints: false }, geometry));

    expect(result.current.readOnlyGpxTour?.tour.name).toBe('Saved ridge');
    expect(result.current.readOnlyGpxTour?.routeGeometry).toBe(geometry);
    expect(result.current.mode.type).toBe('view-gpx');
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.name).toBe('');
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => result.current.closeGpxTour());
    expect(result.current.readOnlyGpxTour).toBeNull();
    expect(result.current.mode).toEqual({ type: 'neutral' });
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('keeps profile focus transient and clears it on collapse and GPX selection changes', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 141 }));
    const geometry = JSON.stringify([
      [48, 11, 500],
      [48.01, 11.02, 550],
    ]);
    const focus = { distanceMeters: 500, elevationMeters: 525, lat: 48.005, lng: 11.01, sampleIndex: 1 };

    act(() => result.current.viewGpxTour({ ...savedTour, has_waypoints: false }, geometry));
    act(() => result.current.setRouteProfileFocus(focus));
    expect(result.current.routeProfileFocus).toEqual(focus);
    expect(localStorage.getItem('tour-draft-141')).toBeNull();

    act(() => result.current.toggleElevationProfile());
    expect(result.current.elevationProfileExpanded).toBe(false);
    expect(result.current.routeProfileFocus).toBeNull();

    act(() => result.current.setRouteProfileFocus(focus));
    act(() => result.current.viewGpxTour({ ...savedTour, place_id: 43, has_waypoints: false }, geometry));
    expect(result.current.routeProfileFocus).toBeNull();
    expect(result.current.readOnlyGpxTour?.tour.place_id).toBe(43);
  });

  it('keeps focus on last-good geometry while rerouting and clears it when replacement geometry becomes ready', async () => {
    const replacementRoute = {
      ...routed,
      coordinates: [
        [49, 12],
        [49.02, 12.03],
      ] as [number, number][],
    };
    const replacementGeometry = [
      [49, 12, 600],
      [49.02, 12.03, 640],
    ] as [number, number, number][];
    routeWalkingTour.mockResolvedValueOnce(routed).mockResolvedValueOnce(replacementRoute);
    enrichTourElevations.mockResolvedValueOnce(enriched).mockResolvedValueOnce(replacementGeometry);
    const { result } = renderHook(() => useTourPlanner({ tripId: 142 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const focus = { distanceMeters: 500, elevationMeters: 525, lat: 48.005, lng: 11.01, sampleIndex: 1 };
    act(() => result.current.setRouteProfileFocus(focus));

    act(() => result.current.addWaypoint(48.02, 11.04));
    expect(result.current.routeProfileFocus).toEqual(focus);
    expect(result.current.enrichedGeometry).toEqual(enriched);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.enrichedGeometry).toEqual(replacementGeometry);
    expect(result.current.routeProfileFocus).toBeNull();
    expect(JSON.parse(localStorage.getItem('tour-draft-142') || '{}')).not.toHaveProperty('routeProfileFocus');
  });

  it('clears derived route state when deleting below two waypoints', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 143 }));
    act(() => {
      result.current.setName('Keep this draft');
      result.current.setMaxHikingDifficulty(4);
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.status).toBe('ready');

    act(() =>
      result.current.setRouteProfileFocus({
        distanceMeters: 500,
        elevationMeters: 525,
        lat: 48.005,
        lng: 11.01,
        sampleIndex: 1,
      })
    );
    const removedId = result.current.waypoints[1].id;
    act(() => result.current.removeWaypoint(removedId));

    expect(result.current.waypoints).toHaveLength(1);
    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.routeProfileFocus).toBeNull();
    expect(result.current.canSave).toBe(false);
    expect(result.current.name).toBe('Keep this draft');
    expect(result.current.maxHikingDifficulty).toBe(4);
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.canUndo).toBe(true);
    expect(JSON.parse(localStorage.getItem('tour-draft-143') || 'null')).toMatchObject({
      name: 'Keep this draft',
      maxHikingDifficulty: 4,
      waypoints: [{ lat: 48, lng: 11, role: 'start' }],
    });
  });

  it('keeps the last-good route while deleting from three waypoints to two', async () => {
    const replacementRoute = {
      ...routed,
      coordinates: [
        [49, 12],
        [49.02, 12.03],
      ] as [number, number][],
    };
    const replacementGeometry = [
      [49, 12, 600],
      [49.02, 12.03, 640],
    ] as [number, number, number][];
    routeWalkingTour.mockResolvedValueOnce(routed).mockResolvedValueOnce(replacementRoute);
    enrichTourElevations.mockResolvedValueOnce(enriched).mockResolvedValueOnce(replacementGeometry);
    const { result } = renderHook(() => useTourPlanner({ tripId: 144 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
      result.current.addWaypoint(48.02, 11.04);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    act(() => result.current.removeWaypoint(result.current.waypoints[2].id));

    expect(result.current.waypoints).toHaveLength(2);
    expect(result.current.status).toBe('dirty');
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.enrichedGeometry).toEqual(enriched);
    expect(result.current.distanceMeters).toBe(routed.distanceMeters);
    expect(result.current.durationSeconds).toBe(routed.durationSeconds);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.route).toEqual(replacementRoute.coordinates);
    expect(result.current.enrichedGeometry).toEqual(replacementGeometry);
  });

  it('clears all derived route state when deleting to zero waypoints', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 145 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    act(() => {
      for (const point of [...result.current.waypoints]) result.current.removeWaypoint(point.id);
    });

    expect(result.current.waypoints).toEqual([]);
    expect(result.current.status).toBe('empty');
    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.routeProfileFocus).toBeNull();
    expect(result.current.canSave).toBe(false);
  });

  it('does not restore a late route response after deleting to one waypoint', async () => {
    const pendingRoute = deferred<typeof routed | null>();
    routeWalkingTour.mockReturnValueOnce(pendingRoute.promise);
    const { result } = renderHook(() => useTourPlanner({ tripId: 146 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const signal = routeWalkingTour.mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);

    act(() => result.current.removeWaypoint(result.current.waypoints[1].id));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      pendingRoute.resolve(routed);
      await Promise.resolve();
    });

    expect(result.current.route).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
  });

  it('does not restore late elevation after deleting to one waypoint', async () => {
    const pendingElevation = deferred<typeof enriched | null>();
    enrichTourElevations.mockReturnValueOnce(pendingElevation.promise);
    const { result } = renderHook(() => useTourPlanner({ tripId: 147 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const signal = enrichTourElevations.mock.calls[0][1] as AbortSignal;
    expect(result.current.status).toBe('enriching-elevation');

    act(() => result.current.removeWaypoint(result.current.waypoints[1].id));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      pendingElevation.resolve(enriched);
      await Promise.resolve();
    });

    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
  });

  it('reroutes after Undo and clears again on Redo to one waypoint', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 148 }));
    act(() => {
      result.current.setName('Undo ridge');
      result.current.setMaxHikingDifficulty(5);
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    act(() => result.current.removeWaypoint(result.current.waypoints[1].id));
    expect(result.current.route).toBeNull();

    act(() => result.current.undo());
    expect(result.current.waypoints).toHaveLength(2);
    expect(result.current.canRedo).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.enrichedGeometry).toEqual(enriched);

    act(() => result.current.redo());
    expect(result.current.waypoints).toHaveLength(1);
    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.routeProfileFocus).toBeNull();
    expect(result.current.name).toBe('Undo ridge');
    expect(result.current.maxHikingDifficulty).toBe(5);
    expect(result.current.canSave).toBe(false);
    expect(JSON.parse(localStorage.getItem('tour-draft-148') || 'null')?.waypoints).toHaveLength(1);
  });

  it('restores a one-waypoint draft without routed or elevation output', async () => {
    localStorage.setItem(
      'tour-draft-149',
      JSON.stringify({
        version: 2,
        name: 'Recovered incomplete ridge',
        waypoints: [{ id: 'only-point', lat: 48, lng: 11, role: 'start' }],
        maxHikingDifficulty: 6,
        editingPlaceId: null,
      })
    );
    const { result } = renderHook(() => useTourPlanner({ tripId: 149 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    expect(result.current.waypoints).toHaveLength(1);
    expect(result.current.name).toBe('Recovered incomplete ridge');
    expect(result.current.maxHikingDifficulty).toBe(6);
    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.routeAnalysis).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.canSave).toBe(false);
    expect(routeWalkingTour).not.toHaveBeenCalled();
    expect(localStorage.getItem('tour-draft-149')).not.toBeNull();
  });

  it('TOUR-PLANNER-009: persists a changed routing difficulty in the recoverable draft', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 15 }));
    act(() => result.current.setMaxHikingDifficulty(4));

    expect(JSON.parse(localStorage.getItem('tour-draft-15') || 'null')).toMatchObject({
      maxHikingDifficulty: 4,
    });
  });

  it('TOUR-PLANNER-010: starts a clean T2 draft and clears route, selection, history, and stored draft', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 16 }));
    act(() => {
      result.current.setName('Old draft');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
      result.current.setMaxHikingDifficulty(4);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const previousDraft = localStorage.getItem('tour-draft-16');
    expect(previousDraft).not.toBeNull();
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.startNewTour(true));

    expect(result.current.name).toBe('');
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.maxHikingDifficulty).toBe(2);
    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.readOnlyGpxTour).toBeNull();
    expect(result.current.route).toBeNull();
    expect(result.current.enrichedGeometry).toBeNull();
    expect(result.current.distanceMeters).toBeNull();
    expect(result.current.durationSeconds).toBeNull();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(result.current.status).toBe('empty');
    expect(JSON.parse(localStorage.getItem('tour-draft-16') || 'null')).toMatchObject({
      name: '',
      waypoints: [],
      maxHikingDifficulty: 2,
      editingPlaceId: null,
    });

    act(() => result.current.addWaypoint(47, 10));
    expect(localStorage.length).toBe(1);
    expect(JSON.parse(localStorage.getItem('tour-draft-16') || 'null')).toMatchObject({
      name: '',
      maxHikingDifficulty: 2,
      editingPlaceId: null,
      waypoints: [{ lat: 47, lng: 10, role: 'start' }],
    });
  });

  it('TOUR-PLANNER-011: protects a dirty draft until new-tour confirmation and cancel preserve it', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 17 }));
    act(() => {
      result.current.setName('Keep this draft');
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    const waypoints = result.current.waypoints;
    const storedDraft = localStorage.getItem('tour-draft-17');

    act(() => result.current.startNewTour());
    expect(result.current.newTourConfirmationOpen).toBe(true);
    expect(result.current.name).toBe('Keep this draft');
    expect(result.current.waypoints).toBe(waypoints);
    expect(localStorage.getItem('tour-draft-17')).toBe(storedDraft);

    act(() => result.current.cancelNewTour());
    expect(result.current.newTourConfirmationOpen).toBe(false);
    expect(result.current.name).toBe('Keep this draft');
    expect(result.current.waypoints).toBe(waypoints);
    expect(localStorage.getItem('tour-draft-17')).toBe(storedDraft);
  });

  it('TOUR-PLANNER-012: opening a saved Tour then starting new never updates the saved Tour', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    const { result } = renderHook(() => useTourPlanner({ tripId: 18 }));
    await act(async () => {
      await result.current.openTour(savedTour);
    });
    expect(result.current.editingPlaceId).toBe(42);

    act(() => result.current.startNewTour());

    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.newTourConfirmationOpen).toBe(false);
    expect(result.current.waypoints).toEqual([]);
    expect(updateTour).not.toHaveBeenCalled();
    expect(createTour).not.toHaveBeenCalled();
  });

  it('TOUR-PLANNER-013: starting new from GPX clears read-only selection and creates no waypoints', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 19 }));
    act(() =>
      result.current.viewGpxTour(
        { ...savedTour, has_waypoints: false },
        JSON.stringify([
          [48, 11],
          [48.01, 11.02],
        ])
      )
    );
    expect(result.current.readOnlyGpxTour).not.toBeNull();

    act(() => result.current.startNewTour());

    expect(result.current.readOnlyGpxTour).toBeNull();
    expect(result.current.newTourConfirmationOpen).toBe(false);
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.route).toBeNull();
    expect(result.current.maxHikingDifficulty).toBe(2);
  });

  it('TOUR-PLANNER-014: an empty draft with no name or waypoints starts over without confirmation', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 20 }));
    act(() => result.current.setMaxHikingDifficulty(4));
    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => result.current.startNewTour());

    expect(result.current.newTourConfirmationOpen).toBe(false);
    expect(result.current.maxHikingDifficulty).toBe(2);
    expect(result.current.waypoints).toEqual([]);
    expect(JSON.parse(localStorage.getItem('tour-draft-20') || 'null')).toMatchObject({
      name: '',
      waypoints: [],
      maxHikingDifficulty: 2,
    });
  });

  it('TOUR-PLANNER-015: starting new before any edits does not ask for confirmation', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 21 }));
    act(() => result.current.startNewTour());

    expect(result.current.newTourConfirmationOpen).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.maxHikingDifficulty).toBe(2);
  });

  it('TOUR-PLANNER-016: derives neutral without creating an implicit local draft', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 22 }));

    expect(result.current.mode).toEqual({ type: 'neutral' });
    expect(result.current.name).toBe('');
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(localStorage.getItem('tour-draft-22')).toBeNull();
  });

  it('TOUR-PLANNER-017: starting new derives new-draft and persists its blank T2 draft', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 23 }));
    act(() => result.current.startNewTour());

    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(JSON.parse(localStorage.getItem('tour-draft-23') || 'null')).toMatchObject({
      version: 2,
      name: '',
      waypoints: [],
      maxHikingDifficulty: 2,
      editingPlaceId: null,
    });
  });

  it('TOUR-PLANNER-018: restores new and saved drafts into their derived modes', () => {
    localStorage.setItem(
      'tour-draft-24',
      JSON.stringify({
        version: 2,
        name: 'Restored new hike',
        waypoints: [{ id: 'new-start', lat: 48, lng: 11, role: 'start' }],
        maxHikingDifficulty: 2,
        editingPlaceId: null,
      })
    );
    localStorage.setItem(
      'tour-draft-25',
      JSON.stringify({
        version: 2,
        name: 'Restored saved hike',
        waypoints: [{ id: 'saved-start', lat: 48, lng: 11, role: 'start' }],
        maxHikingDifficulty: 3,
        editingPlaceId: 42,
      })
    );

    const freshDraft = renderHook(() => useTourPlanner({ tripId: 24 }));
    const savedEdit = renderHook(() => useTourPlanner({ tripId: 25 }));

    expect(freshDraft.result.current.mode).toEqual({ type: 'new-draft' });
    expect(freshDraft.result.current.draftRestored).toBe(true);
    expect(savedEdit.result.current.mode).toEqual({ type: 'edit-saved', placeId: 42 });
    expect(savedEdit.result.current.draftRestored).toBe(true);
  });

  it('TOUR-PLANNER-019: saved selection remains edit-saved after save and GPX selection derives view-gpx', async () => {
    const detail = {
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    detailTour.mockResolvedValue(detail);
    updateTour.mockResolvedValue({ ...detail, tour: savedTour });
    const { result } = renderHook(() => useTourPlanner({ tripId: 26 }));

    await act(async () => {
      await result.current.openTour(savedTour);
    });
    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: 42 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    act(() => result.current.setName('Saved ridge renamed'));
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: 42 });
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => result.current.startNewTour());
    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.saveOutcome).toBeNull();

    act(() =>
      result.current.viewGpxTour({ ...savedTour, place_id: 43, has_waypoints: false }, '[[48,11],[48.01,11.02]]')
    );
    expect(result.current.mode).toEqual({
      type: 'view-gpx',
      placeId: 43,
      tour: expect.objectContaining({ place_id: 43 }),
    });
    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('TOUR-PLANNER-020: leaving Tours forgets GPX but preserves a meaningful editable draft', () => {
    const { result, unmount } = renderHook(() => useTourPlanner({ tripId: 27 }));
    act(() => {
      result.current.startNewTour();
      result.current.setName('Keep this new draft');
      result.current.addWaypoint(48, 11);
    });
    const savedDraft = localStorage.getItem('tour-draft-27');

    act(() => result.current.closeGpxTour());

    expect(result.current.mode).toEqual({ type: 'new-draft' });
    expect(result.current.name).toBe('Keep this new draft');
    expect(result.current.waypoints).toHaveLength(1);
    expect(localStorage.getItem('tour-draft-27')).toBe(savedDraft);

    unmount();
    const reopened = renderHook(() => useTourPlanner({ tripId: 27 }));
    expect(reopened.result.current.mode).toEqual({ type: 'new-draft' });
    expect(reopened.result.current.name).toBe('Keep this new draft');

    act(() => reopened.result.current.viewGpxTour({ ...savedTour, has_waypoints: false }, '[[48,11],[48.01,11.02]]'));
    expect(reopened.result.current.mode.type).toBe('view-gpx');
    act(() => reopened.result.current.closeGpxTour());
    expect(reopened.result.current.mode).toEqual({ type: 'neutral' });
    expect(reopened.result.current.readOnlyGpxTour).toBeNull();

    reopened.unmount();
    const cleanReopen = renderHook(() => useTourPlanner({ tripId: 27 }));
    expect(cleanReopen.result.current.mode).toEqual({ type: 'neutral' });
    expect(cleanReopen.result.current.readOnlyGpxTour).toBeNull();
  });

  it('TOUR-PLANNER-021: returning from a dirty saved edit clears only local editor state', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    const { result } = renderHook(() => useTourPlanner({ tripId: 29 }));
    await act(async () => {
      await result.current.openTour(savedTour);
    });
    act(() => result.current.setName('Unsaved rename'));
    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: savedTour.place_id });
    const persistedDraft = localStorage.getItem('tour-draft-29');
    expect(persistedDraft).not.toBeNull();

    act(() => result.current.returnToNeutral());

    expect(result.current.mode).toEqual({ type: 'neutral' });
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.name).toBe('');
    expect(localStorage.getItem('tour-draft-29')).toBeNull();
    expect(updateTour).not.toHaveBeenCalled();
    expect(createTour).not.toHaveBeenCalled();
  });

  it('clears a successfully deleted saved Tour from the editor and blocks a stale update', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    const { result } = renderHook(() => useTourPlanner({ tripId: 29 }));
    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(true);
    });
    act(() => result.current.setName('Unsaved rename'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(result.current.mode).toEqual({ type: 'edit-saved', placeId: savedTour.place_id });
    const view = render(<TourPlannerRail planner={result.current} />);
    expect(screen.getByRole('heading', { name: 'Edit tour' })).toBeInTheDocument();

    act(() => result.current.forgetDeletedTour(savedTour.place_id));
    view.rerender(<TourPlannerRail planner={result.current} />);

    expect(result.current.mode).toEqual({ type: 'neutral' });
    expect(result.current.editingPlaceId).toBeNull();
    expect(result.current.waypoints).toEqual([]);
    expect(result.current.route).toBeNull();
    expect(result.current.routeProfileFocus).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.canSave).toBe(false);
    expect(localStorage.getItem('tour-draft-29')).toBeNull();
    expect(screen.getByText('Plan a tour')).toBeInTheDocument();
    expect(screen.queryByText('Tour could not be saved. Your draft is still here.')).not.toBeInTheDocument();
    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });
    expect(updateTour).not.toHaveBeenCalled();
  });

  it('keeps the existing save-failure notice and draft when a Tour update fails', async () => {
    detailTour.mockResolvedValue({
      tour: savedTour,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    updateTour.mockRejectedValue(new Error('Tour update failed'));
    const { result } = renderHook(() => useTourPlanner({ tripId: 29 }));
    await act(async () => {
      expect(await result.current.openTour(savedTour)).toBe(true);
    });
    act(() => result.current.setName('Keep this draft'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    const view = render(<TourPlannerRail planner={result.current} />);

    await act(async () => {
      expect(await result.current.save()).toBeNull();
    });
    view.rerender(<TourPlannerRail planner={result.current} />);

    expect(result.current.editingPlaceId).toBe(savedTour.place_id);
    expect(result.current.name).toBe('Keep this draft');
    expect(screen.getByText('Tour could not be saved. Your draft is still here.')).toBeInTheDocument();
  });
});
