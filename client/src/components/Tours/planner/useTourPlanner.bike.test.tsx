import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, routeBikeTour, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(
  () => ({
    routeWalkingTour: vi.fn(),
    routeBikeTour: vi.fn(),
    enrichTourElevations: vi.fn(),
    createTour: vi.fn(),
    detailTour: vi.fn(),
    updateTour: vi.fn(),
  })
);

vi.mock('./tourRouting', () => ({ routeWalkingTour, routeBikeTour, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({ useTourPermissions: () => ({ canEdit: true, canAssign: true }) }));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import { useTourPlanner } from './useTourPlanner';

// FE-TOUR-BIKE-001 to FE-TOUR-BIKE-005

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
  distanceMeters: 9000,
  durationSeconds: 1800,
};
const enriched = [
  [48, 11, 500],
  [48.01, 11.02, 560],
] as [number, number, number][];
const savedBike = {
  place_id: 77,
  name: 'Gravel loop',
  tour_type: 'bike' as const,
  bike_profile: 'gravel' as const,
  distance: 9,
  elevation_gain: 60,
  elevation_loss: 0,
  duration: 30,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  planned: false,
  caution: false,
  revision: 3,
};
const ferrata = {
  kind: 'ferrata' as const,
  ref: 'way/9',
  name: 'Steig',
  geometry: [
    [48, 11],
    [48.01, 11.02],
  ] as Array<[number, number]>,
};

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(450);
  });
}

describe('useTourPlanner, bike tours (BIK-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    routeBikeTour.mockReset().mockResolvedValue(routed);
    enrichTourElevations.mockReset().mockResolvedValue(enriched);
    createTour.mockReset();
    detailTour.mockReset();
    updateTour.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('FE-TOUR-BIKE-001: a bike tour is routed for its profile, touring first, and never on foot', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 51 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
    });
    act(() => result.current.setTourType('bike'));
    expect(result.current.isBike).toBe(true);
    expect(result.current.bikeProfile).toBe('touring');
    routeWalkingTour.mockClear();
    await settle();
    expect(routeBikeTour).toHaveBeenLastCalledWith(expect.any(Array), 'touring', expect.any(AbortSignal));
    expect(routeWalkingTour).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
    // The router's riding time is the tour's time, heights or not.
    expect(result.current.walkingDurationMinutes).toBe(30);
  });

  it('FE-TOUR-BIKE-002: a profile is one step of the history, kept in the draft, and plans the route again', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 52 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
      result.current.setTourType('bike');
    });
    await settle();
    act(() => result.current.setBikeProfile('road'));
    expect(JSON.parse(draftStore.getItem('tour-draft-52') || 'null')).toMatchObject({
      version: 11,
      tourType: 'bike',
      bikeProfile: 'road',
    });
    await settle();
    expect(routeBikeTour).toHaveBeenLastCalledWith(expect.any(Array), 'road', expect.any(AbortSignal));
    // The same profile again is no step; an undo takes it back.
    act(() => result.current.setBikeProfile('road'));
    act(() => result.current.undo());
    expect(result.current.bikeProfile).toBe('touring');
    act(() => result.current.redo());
    expect(result.current.bikeProfile).toBe('road');
  });

  it('FE-TOUR-BIKE-003: a failed route keeps the last one planned and says so', async () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 53 }));
    act(() => {
      result.current.addWaypoint(48, 11);
      result.current.addWaypoint(48.01, 11.02);
      result.current.setTourType('bike');
    });
    await settle();
    expect(result.current.route).toEqual(routed.coordinates);
    routeBikeTour.mockResolvedValueOnce(null);
    act(() => result.current.setBikeProfile('mtb'));
    await settle();
    expect(result.current.status).toBe('routing-failed');
    expect(result.current.error).toBe('routing');
    expect(result.current.route).toEqual(routed.coordinates);
    expect(result.current.canSave).toBe(false);
  });

  it('FE-TOUR-BIKE-004: switching to a bike tour drops a via ferrata, the router plans that leg', () => {
    const { result } = renderHook(() => useTourPlanner({ tripId: 54 }));
    act(() => result.current.appendFixedLeg(ferrata));
    expect(result.current.waypoints[0].fixedLeg?.kind).toBe('ferrata');
    act(() => result.current.setTourType('bike'));
    expect(result.current.waypoints.some((point) => point.fixedLeg)).toBe(false);
    act(() => result.current.undo());
    expect(result.current.waypoints[0].fixedLeg?.kind).toBe('ferrata');
  });

  it('FE-TOUR-BIKE-005: opens a saved bike tour with its profile and saves it with nothing of a hike', async () => {
    detailTour.mockResolvedValue({
      tour: savedBike,
      waypoints: [
        { lat: 48, lng: 11, role: 'start', sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
      ],
    });
    updateTour.mockResolvedValue({ tour: { ...savedBike, revision: 4 }, waypoints: [] });
    const { result } = renderHook(() => useTourPlanner({ tripId: 55 }));
    await act(async () => {
      await result.current.openTour({ place_id: 77 });
    });
    expect(result.current.tourType).toBe('bike');
    expect(result.current.bikeProfile).toBe('gravel');
    act(() => result.current.setName('Gravel loop, longer'));
    await settle();
    await act(async () => {
      await result.current.save();
    });
    expect(updateTour).toHaveBeenCalledWith(
      55,
      77,
      expect.objectContaining({
        tour_type: 'bike',
        bike_profile: 'gravel',
        max_hiking_difficulty: null,
        hiking_preferences: null,
        expected_revision: 3,
      })
    );
  });
});
