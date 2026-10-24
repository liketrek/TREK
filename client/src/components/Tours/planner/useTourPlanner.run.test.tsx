import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, routeRun, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(() => ({
  routeWalkingTour: vi.fn(),
  routeRun: vi.fn(),
  enrichTourElevations: vi.fn(),
  createTour: vi.fn(),
  detailTour: vi.fn(),
  updateTour: vi.fn(),
}));

vi.mock('./tourRouting', () => ({ routeWalkingTour, routeRun, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({ useTourPermissions: () => ({ canEdit: true, canAssign: true }) }));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import type { DerivedTourDraft } from './tourPlannerDraft';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-RUN-001 to FE-TOUR-RUN-010

const routed = {
  coordinates: [
    [48, 11],
    [48.01, 11.02],
  ] as [number, number][],
  distanceMeters: 1860,
  // A walker's time: a run never takes it.
  durationSeconds: 1500,
};
const enriched = [
  [48, 11, 520],
  [48.01, 11.02, 560],
] as [number, number, number][];
const savedRun = {
  place_id: 91,
  name: 'River loop',
  tour_type: 'run' as const,
  run_profile: 'running' as const,
  run_pace_seconds_per_km: 330,
  distance: 1.86,
  elevation_gain: 40,
  elevation_loss: 0,
  duration: 10,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  planned: true,
  caution: false,
  revision: 3,
};
const savedPoints = [
  { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
  { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
];

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

async function plannedRun(tripId: number) {
  const hook = renderHook(() => useTourPlanner({ tripId }));
  act(() => {
    hook.result.current.setName('River loop');
    hook.result.current.setTourType('run');
    hook.result.current.addWaypoint(48, 11);
    hook.result.current.addWaypoint(48.01, 11.02);
  });
  await settle();
  return hook;
}

describe("useTourPlanner, a run at the runner's own pace (RUN-01)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    routeRun.mockReset().mockResolvedValue(routed);
    enrichTourElevations.mockReset().mockResolvedValue(enriched);
    createTour.mockReset();
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-RUN-001: a run is routed on foot for its profile, and has no time and no save until a pace is entered', async () => {
    const { result } = await plannedRun(71);
    expect(result.current.isRun).toBe(true);
    expect(result.current.runProfile).toBe('running');
    expect(routeRun).toHaveBeenCalledWith(expect.any(Array), 'running', expect.any(AbortSignal));
    expect(routeWalkingTour).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
    // No pace of TREK's own: the time stays unknown and the router's walking time never stands in.
    expect(result.current.runPace.paceSecondsPerKm).toBeNull();
    expect(result.current.walkingDurationMinutes).toBeNull();
    expect(result.current.runPaceMissing).toBe(true);
    expect(result.current.canSave).toBe(false);
  });

  it('FE-TOUR-RUN-002: the time is the distance at the pace, and a new pace plans nothing again', async () => {
    const { result } = await plannedRun(72);
    routeRun.mockClear();
    act(() => result.current.runPace.setPace(360));
    await settle();
    const distanceKm = result.current.routeAnalysis?.distanceKm ?? 0;
    expect(distanceKm).toBeGreaterThan(1);
    expect(result.current.walkingDurationMinutes).toBe(Math.round(distanceKm * 6));
    expect(result.current.plannedTotalMinutes).toBe(Math.round(distanceKm * 6));
    expect(routeRun).not.toHaveBeenCalled();
    expect(result.current.canSave).toBe(true);
    act(() => result.current.runPace.setPace(300));
    expect(result.current.walkingDurationMinutes).toBe(Math.round(distanceKm * 5));
  });

  it('FE-TOUR-RUN-003: a pace that is no pace, or out of bounds, holds Save back', async () => {
    const { result } = await plannedRun(73);
    act(() => result.current.runPace.setPace(Number.NaN));
    expect(result.current.runPaceInvalid).toBe(true);
    expect(result.current.walkingDurationMinutes).toBeNull();
    expect(result.current.canSave).toBe(false);
    act(() => result.current.runPace.setPace(90));
    expect(result.current.runPaceInvalid).toBe(true);
    expect(result.current.canSave).toBe(false);
    act(() => result.current.runPace.setPace(420));
    expect(result.current.runPaceInvalid).toBe(false);
    expect(result.current.canSave).toBe(true);
  });

  it('FE-TOUR-RUN-004: saves the type, profile, pace and planned time with the route', async () => {
    createTour.mockResolvedValue({ tour: savedRun, waypoints: savedPoints });
    const { result } = await plannedRun(74);
    act(() => result.current.runPace.setPace(330));
    await act(async () => {
      await result.current.save();
    });
    const minutes = result.current.walkingDurationMinutes ?? 0;
    expect(createTour).toHaveBeenCalledWith(
      74,
      expect.objectContaining({
        tour_type: 'run',
        run_profile: 'running',
        run_pace_seconds_per_km: 330,
        max_hiking_difficulty: null,
        bike_profile: null,
        ski_discipline: null,
        duration_seconds: minutes * 60,
      })
    );
  });

  it('FE-TOUR-RUN-005: opens a saved run with its profile and pace, and another type saves neither', async () => {
    detailTour.mockResolvedValue({ tour: savedRun, waypoints: savedPoints });
    updateTour.mockResolvedValue({ tour: { ...savedRun, tour_type: 'hike', revision: 4 }, waypoints: savedPoints });
    const { result } = renderHook(() => useTourPlanner({ tripId: 75 }));
    await act(async () => {
      await result.current.openTour({ place_id: 91 });
    });
    expect(result.current.tourType).toBe('run');
    expect(result.current.runProfile).toBe('running');
    expect(result.current.runPace.paceSecondsPerKm).toBe(330);
    expect(result.current.hasUnsavedChanges).toBe(false);
    // The same pace again, or the same profile, is no edit.
    act(() => {
      result.current.runPace.setPace(330);
      result.current.setRunProfile('running');
    });
    expect(result.current.hasUnsavedChanges).toBe(false);
    act(() => result.current.setTourType('hike'));
    await settle();
    await act(async () => {
      await result.current.save();
    });
    expect(updateTour).toHaveBeenCalledWith(
      75,
      91,
      expect.objectContaining({ tour_type: 'hike', run_profile: null, run_pace_seconds_per_km: null })
    );
  });

  it('FE-TOUR-RUN-006: a draft comes back as a run with its pace, and a new tour starts as a hike without one', async () => {
    const first = renderHook(() => useTourPlanner({ tripId: 76 }));
    act(() => {
      first.result.current.setTourType('run');
      first.result.current.runPace.setPace(345);
    });
    first.unmount();
    expect(JSON.parse(draftStore.getItem('tour-draft-76') || 'null')).toMatchObject({
      tourType: 'run',
      runProfile: 'running',
      runPaceSecondsPerKm: 345,
    });
    const again = renderHook(() => useTourPlanner({ tripId: 76 }));
    await act(async () => {});
    expect(again.result.current.tourType).toBe('run');
    expect(again.result.current.runPace.paceSecondsPerKm).toBe(345);
    act(() => again.result.current.startNewTour(true));
    expect(again.result.current.tourType).toBe('hike');
    expect(again.result.current.runPace.paceSecondsPerKm).toBeNull();
  });

  it('FE-TOUR-RUN-007: choosing run is one step of the history and the pace none of it', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 77 }));
    act(() => result.current.setTourType('run'));
    act(() => result.current.runPace.setPace(360));
    act(() => result.current.undo());
    expect(result.current.tourType).toBe('hike');
    expect(result.current.runPace.paceSecondsPerKm).toBe(360);
    act(() => result.current.redo());
    expect(result.current.tourType).toBe('run');
    expect(result.current.runProfile).toBe('running');
  });

  it('FE-TOUR-RUN-008: a run planned over keeps the pace it holds, and a draft without one starts with none', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 78 }));
    const draft: DerivedTourDraft = {
      name: 'River loop',
      difficulty: 1,
      points: [
        { lat: 48, lng: 11 },
        { lat: 48.01, lng: 11.02 },
      ],
      sourcePlaceId: 91,
      inPlace: true,
      revision: 3,
      tourType: 'run',
      runProfile: 'running',
    };
    act(() => {
      result.current.runPace.load(400);
      result.current.startDerivedTour({ ...draft, runPaceSecondsPerKm: 330 });
    });
    await settle();
    expect(result.current.tourType).toBe('run');
    expect(result.current.runPace.paceSecondsPerKm).toBe(330);
    expect(result.current.runPaceMissing).toBe(false);
    expect(result.current.canSave).toBe(true);
    act(() => {
      result.current.startDerivedTour(draft);
    });
    expect(result.current.runPace.paceSecondsPerKm).toBeNull();
    expect(result.current.runPaceMissing).toBe(true);
  });

  it('FE-TOUR-RUN-009: trail running plans the route again for trails, keeps the pace and its sum, and saves as trail (RUN-02)', async () => {
    createTour.mockResolvedValue({ tour: { ...savedRun, run_profile: 'trail' }, waypoints: savedPoints });
    const { result } = await plannedRun(79);
    act(() => result.current.runPace.setPace(450));
    routeRun.mockClear();
    act(() => result.current.setRunProfile('trail'));
    await settle();
    expect(routeRun).toHaveBeenCalledWith(expect.any(Array), 'trail', expect.any(AbortSignal));
    expect(result.current.runProfile).toBe('trail');
    const distanceKm = result.current.routeAnalysis?.distanceKm ?? 0;
    // The profile changes the ways, never the time: still the distance at the pace, nothing for the terrain.
    expect(result.current.walkingDurationMinutes).toBe(Math.round(distanceKm * 7.5));
    await act(async () => {
      await result.current.save();
    });
    expect(createTour).toHaveBeenCalledWith(
      79,
      expect.objectContaining({ tour_type: 'run', run_profile: 'trail', run_pace_seconds_per_km: 450 })
    );
  });

  it('FE-TOUR-RUN-010: a trail route the router cannot plan keeps the last route, and the run waits rather than saving it (RUN-02)', async () => {
    const { result } = await plannedRun(80);
    act(() => result.current.runPace.setPace(450));
    routeRun.mockResolvedValueOnce(null);
    act(() => result.current.setRunProfile('trail'));
    await settle();
    expect(result.current.status).toBe('routing-failed');
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.tourType).toBe('run');
    expect(result.current.runPace.paceSecondsPerKm).toBe(450);
    expect(result.current.canSave).toBe(false);
  });
});
