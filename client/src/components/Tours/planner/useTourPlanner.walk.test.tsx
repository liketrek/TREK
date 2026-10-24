import { act, renderHook } from '@testing-library/react';
import type { TourCreateRequest, TourCreateResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, routeCityWalk, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(
  () => ({
    routeWalkingTour: vi.fn(),
    routeCityWalk: vi.fn(),
    enrichTourElevations: vi.fn(),
    createTour: vi.fn(),
    detailTour: vi.fn(),
    updateTour: vi.fn(),
  })
);

vi.mock('./tourRouting', () => ({ routeWalkingTour, routeCityWalk, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({ useTourPermissions: () => ({ canEdit: true, canAssign: true }) }));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-WALK-PLANNER-001 to FE-TOUR-WALK-PLANNER-008: a city walk's stays in the planner, edited without
// planning its route again, and saved without breaks (CW-02). FE-TOUR-WALK-PLANNER-009 and 010: a walk an
// assistant saved with its stops only, planned when it is opened (CW-11).

/** 45 minutes on foot between the stops. */
const routed = {
  coordinates: [
    [48, 11],
    [48.01, 11.02],
  ] as [number, number][],
  parts: [
    {
      coordinates: [
        [48, 11],
        [48.01, 11.02],
      ] as [number, number][],
      free: false,
    },
  ],
  distanceMeters: 3200,
  durationSeconds: 2700,
};
const enriched = [
  [48, 11, 520],
  [48.01, 11.02, 525],
] as [number, number, number][];

/** The server's answer to a save: the points in their order, each with a key. */
const answered = (body: TourCreateRequest): TourCreateResponse => ({
  tour: {
    place_id: 42,
    name: body.name,
    tour_type: 'walk',
    distance: 3.2,
    elevation_gain: 5,
    elevation_loss: 0,
    duration: 45,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    revision: 1,
  },
  waypoints: body.waypoints.map((point, index) => ({ ...point, key: point.key ?? `stop-${index}` })),
});

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

/** The value, or a failure saying it is missing instead of a later undefined. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

/** A walk through three stops, named, routed and with its heights: ready to save. */
async function walkPlanned() {
  const hook = renderHook(() => useTourPlanner({ tripId: 31 }));
  act(() => hook.result.current.startNewTour());
  for (const [lat, lng] of [
    [48, 11],
    [48.01, 11.02],
    [48.02, 11],
  ])
    act(() => hook.result.current.addWaypoint(lat, lng));
  act(() => hook.result.current.setTourType('walk'));
  act(() => hook.result.current.setName('Old town'));
  await settle();
  return hook;
}

type Planner = ReturnType<typeof useTourPlanner>;

/** The stay of the stop at `index` set as the station dialog sets it. */
function stayAt(planner: Planner, index: number, stayMinutes: number | null) {
  const id = must(planner.waypoints[index]).id;
  act(() =>
    planner.editWaypoints((points: TourPlannerWaypoint[]) =>
      points.map((point) => (point.id === id ? { ...point, stayMinutes } : point))
    )
  );
}

/** The body of the save the planner sent last. */
const lastSaved = () => createTour.mock.calls[createTour.mock.calls.length - 1]?.[1] as TourCreateRequest;

describe('useTourPlanner, city walks (CW-02)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    routeCityWalk.mockReset().mockResolvedValue(routed);
    enrichTourElevations.mockReset().mockResolvedValue(enriched);
    createTour.mockReset().mockImplementation(async (_trip: number, body: TourCreateRequest) => answered(body));
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-WALK-PLANNER-001: a stay changes the time overview at once, and the route is planned once', async () => {
    const { result } = await walkPlanned();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
    expect(result.current.walkingDurationMinutes).toBe(45);
    expect(result.current.stationStays).toMatchObject({
      stayMinutes: 0,
      unknownStays: 3,
      stations: 3,
      totalMinutes: 45,
    });

    stayAt(result.current, 1, 90);
    stayAt(result.current, 2, 30);
    stayAt(result.current, 0, 0);
    // Nothing waits for a route: the planner stays ready to save after each stay.
    expect(result.current.status).toBe('ready');
    expect(result.current.canSave).toBe(true);
    expect(result.current.stationStays).toMatchObject({
      walkingMinutes: 45,
      stayMinutes: 120,
      unknownStays: 0,
      totalMinutes: 165,
      partial: false,
    });
    expect(result.current.plannedTotalMinutes).toBe(165);

    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
    expect(enrichTourElevations).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('ready');
    expect(result.current.routeCurrent).toBe(true);
  });

  it('FE-TOUR-WALK-PLANNER-002: one undo takes a stay back, still without routing again', async () => {
    const { result } = await walkPlanned();
    stayAt(result.current, 1, 90);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.waypoints[1]?.stayMinutes).toBeUndefined();
    expect(result.current.stationStays?.stayMinutes).toBe(0);
    expect(result.current.status).toBe('ready');
    expect(result.current.canSave).toBe(true);
    act(() => result.current.redo());
    expect(result.current.waypoints[1]?.stayMinutes).toBe(90);
    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-WALK-PLANNER-003: saves the stays and no breaks, so a stay never counts as a break too', async () => {
    const { result } = await walkPlanned();
    // A break kept from the hike this draft was, out of range besides: it neither counts nor holds the save up.
    act(() => result.current.setBreakAdditionalMinutes(5000));
    expect(result.current.breakAdditionalInvalid).toBe(false);
    stayAt(result.current, 1, 90);
    stayAt(result.current, 2, 0);
    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    const body = lastSaved();
    expect(body.break_additional_minutes).toBeNull();
    expect(body.waypoints.map((point) => point.stay_minutes)).toEqual([undefined, 90, 0]);
    expect(body.duration_seconds).toBe(2700);
    expect(result.current.status).toBe('saved');
  });

  it('FE-TOUR-WALK-PLANNER-004: a hike keeps its breaks: they are saved and checked as before', async () => {
    const { result } = await walkPlanned();
    act(() => result.current.setTourType('hike'));
    await settle();
    act(() => result.current.setBreakAdditionalMinutes(5000));
    expect(result.current.breakAdditionalInvalid).toBe(true);
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setBreakAdditionalMinutes(20));
    await act(async () => {
      await result.current.save();
    });
    expect(lastSaved().break_additional_minutes).toBe(20);
  });

  it('FE-TOUR-WALK-PLANNER-005: moving a stop still plans the route again', async () => {
    const { result } = await walkPlanned();
    const stop = must(result.current.waypoints[1]);
    act(() => {
      void result.current.setWaypointPosition(stop.id, 48.011, 11.021);
    });
    expect(result.current.status).toBe('dirty');
    expect(result.current.canSave).toBe(false);
    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('ready');
  });

  it('FE-TOUR-WALK-PLANNER-006: a stay set while the route is being planned lets that planning finish', async () => {
    let answer: (value: typeof routed) => void = () => undefined;
    routeCityWalk.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        })
    );
    const hook = renderHook(() => useTourPlanner({ tripId: 31 }));
    act(() => hook.result.current.startNewTour());
    act(() => hook.result.current.addWaypoint(48, 11));
    act(() => hook.result.current.addWaypoint(48.01, 11.02));
    act(() => hook.result.current.setTourType('walk'));
    act(() => hook.result.current.setName('Old town'));
    await settle();
    expect(hook.result.current.status).toBe('routing');

    stayAt(hook.result.current, 1, 30);
    expect(hook.result.current.status).toBe('routing');
    await act(async () => {
      answer(routed);
      await vi.advanceTimersByTimeAsync(0);
    });
    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe('ready');
    expect(hook.result.current.canSave).toBe(true);
    expect(hook.result.current.plannedTotalMinutes).toBe(75);
  });

  it('FE-TOUR-WALK-PLANNER-007: a stay changed after a save makes the walk ready to save again, its route as it was', async () => {
    const { result } = await walkPlanned();
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.status).toBe('saved');
    expect(result.current.canSave).toBe(false);

    stayAt(result.current, 2, 30);
    expect(result.current.status).toBe('ready');
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.canSave).toBe(true);
    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
  });

  it("FE-TOUR-WALK-PLANNER-008: a loop run the other way keeps its start's stay, counted once", async () => {
    const { result } = await walkPlanned();
    stayAt(result.current, 0, 20);
    act(() => result.current.returnToStart());
    await settle();
    expect(result.current.stationStays).toMatchObject({ stayMinutes: 20, stations: 3 });

    act(() => result.current.reverse());
    expect(result.current.isLoop).toBe(true);
    expect(result.current.waypoints[0]?.stayMinutes).toBe(20);
    expect(result.current.waypoints[3]?.stayMinutes).toBeUndefined();
    expect(result.current.stationStays).toMatchObject({ stayMinutes: 20, stations: 3, unknownStays: 2 });
  });

  /** A saved walk of two stops as the detail answers it, with or without its way. */
  const savedWalk = (routePending: boolean) => ({
    tour: {
      place_id: 42,
      name: 'Briefed walk',
      tour_type: 'walk' as const,
      distance: routePending ? null : 3.2,
      elevation_gain: null,
      elevation_loss: null,
      duration: routePending ? null : 45,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: null,
      planned: false,
      caution: false,
      has_waypoints: true,
      revision: 1,
      route_pending: routePending,
    },
    waypoints: [
      { lat: 48, lng: 11, role: 'start' as const, sequence: 0, key: 'stop-cathedral', name: 'Cathedral' },
      { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1, key: 'stop-park', name: 'Park' },
    ],
  });

  it('FE-TOUR-WALK-PLANNER-009: a walk saved with its stops only is planned on opening and can be saved with its way at once', async () => {
    detailTour.mockResolvedValue(savedWalk(true));
    updateTour.mockImplementation(async (_trip: number, _place: number, body: TourCreateRequest) => answered(body));
    const { result } = renderHook(() => useTourPlanner({ tripId: 31 }));
    await act(async () => {
      await result.current.openTour({ place_id: 42 });
    });
    expect(result.current.routePending).toBe(true);
    expect(result.current.hasUnsavedChanges).toBe(true);

    await settle();
    expect(routeCityWalk).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('ready');
    expect(result.current.canSave).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    expect(updateTour).toHaveBeenCalledWith(
      31,
      42,
      expect.objectContaining({ route_geometry: enriched, tour_type: 'walk', expected_revision: 1 })
    );
    expect(result.current.routePending).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.status).toBe('saved');
  });

  it('FE-TOUR-WALK-PLANNER-010: a walk with its way opens with nothing to save', async () => {
    detailTour.mockResolvedValue(savedWalk(false));
    const { result } = renderHook(() => useTourPlanner({ tripId: 31 }));
    await act(async () => {
      await result.current.openTour({ place_id: 42 });
    });
    await settle();
    expect(result.current.routePending).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.canSave).toBe(false);
  });
});
