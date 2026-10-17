import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { routeWalkingTour, enrichTourElevations, createTour, detailTour, updateTour } = vi.hoisted(() => ({
  routeWalkingTour: vi.fn(),
  enrichTourElevations: vi.fn(),
  createTour: vi.fn(),
  detailTour: vi.fn(),
  updateTour: vi.fn(),
}));

vi.mock('./tourRouting', () => ({ routeWalkingTour, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('../useTourPermissions', () => ({
  useTourPermissions: ({ canEdit = true, canAssign = true }: { canEdit?: boolean; canAssign?: boolean }) => ({
    canEdit,
    canAssign,
  }),
}));

import { useTourPlanner } from './useTourPlanner';

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
  distanceMeters: 2200,
  durationSeconds: 1800,
};
const enriched = [
  [48, 11, 500],
  [48.01, 11.02, 500],
] as [number, number, number][];
const savedTour = {
  place_id: 42,
  name: 'Saved',
  tour_type: 'hike' as const,
  distance: 2.2,
  elevation_gain: 0,
  elevation_loss: 0,
  duration: 30,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
};

function plannerWith(points: Array<[number, number]>) {
  const hook = renderHook(() => useTourPlanner({ tripId: 31 }));
  act(() => hook.result.current.startNewTour());
  for (const [lat, lng] of points) act(() => hook.result.current.addWaypoint(lat, lng));
  return hook;
}

const coordinatesOf = (points: Array<{ lat: number; lng: number }>) => points.map((point) => [point.lat, point.lng]);

describe('useTourPlanner route tools', () => {
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

  describe('return to start (PR1-01)', () => {
    it('closes the tour with one return to the start, not a second start stop, and one undo opens it again', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      act(() => result.current.returnToStart());
      expect(result.current.isLoop).toBe(true);
      expect(coordinatesOf(result.current.waypoints)).toEqual([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
        [48, 11],
      ]);
      expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'via', 'via', 'end']);

      act(() => result.current.returnToStart());
      expect(result.current.waypoints).toHaveLength(4);

      act(() => result.current.undo());
      expect(result.current.isLoop).toBe(false);
      expect(result.current.waypoints).toHaveLength(3);
    });

    it('moves the return with the start, and puts a new point in before the way back', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.returnToStart());
      act(() => {
        result.current.setWaypointPosition(result.current.waypoints[0].id, 48.1, 11.1);
      });
      expect(coordinatesOf(result.current.waypoints)).toEqual([
        [48.1, 11.1],
        [48.01, 11.02],
        [48.1, 11.1],
      ]);

      act(() => result.current.addWaypoint(48.03, 11.04));
      expect(coordinatesOf(result.current.waypoints)).toEqual([
        [48.1, 11.1],
        [48.01, 11.02],
        [48.03, 11.04],
        [48.1, 11.1],
      ]);
      expect(result.current.isLoop).toBe(true);
    });

    it('does nothing on a tour with one point', () => {
      const { result } = plannerWith([[48, 11]]);
      act(() => result.current.returnToStart());
      expect(result.current.waypoints).toHaveLength(1);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('reverse (PR1-02)', () => {
    it('runs the tour backwards as one step, and the next undo brings the old order back', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      const ids = result.current.waypoints.map((point) => point.id);
      act(() => result.current.reverse());
      expect(result.current.waypoints.map((point) => point.id)).toEqual([...ids].reverse());
      expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'via', 'end']);
      act(() => result.current.undo());
      expect(result.current.waypoints.map((point) => point.id)).toEqual(ids);
    });

    it('keeps the name and the hiking limit', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setName('Ridge'));
      act(() => result.current.setMaxHikingDifficulty(3));
      act(() => result.current.reverse());
      expect(result.current.name).toBe('Ridge');
      expect(result.current.maxHikingDifficulty).toBe(3);
    });
  });

  describe('free legs (P2A-04)', () => {
    it('draws one leg by hand and routes it again, each as one step', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      const first = result.current.waypoints[0].id;
      act(() => result.current.toggleWaypointFreeLeg(first));
      expect(result.current.waypoints[0].fixedLeg).toEqual({
        kind: 'free',
        geometry: [
          [48, 11],
          [48.01, 11.02],
        ],
      });
      expect(result.current.waypoints[1].fixedLeg).toBeUndefined();
      act(() => result.current.undo());
      expect(result.current.waypoints[0].fixedLeg).toBeUndefined();
    });

    it('keeps a free leg on save and when the point after it moves', async () => {
      createTour.mockResolvedValue({ tour: savedTour, waypoints: [] });
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setName('Off path'));
      act(() => result.current.toggleWaypointFreeLeg(result.current.waypoints[0].id));
      act(() => {
        result.current.setWaypointPosition(result.current.waypoints[1].id, 48.02, 11.03);
      });
      expect(result.current.waypoints[0].fixedLeg).toEqual({
        kind: 'free',
        geometry: [
          [48, 11],
          [48.02, 11.03],
        ],
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      await act(async () => {
        await result.current.save();
      });
      expect(createTour.mock.calls[0][1].waypoints[0].fixed_leg).toEqual({
        kind: 'free',
        geometry: [
          [48, 11],
          [48.02, 11.03],
        ],
      });
    });
  });

  describe('paddle tours (PAD-01)', () => {
    it('draws every leg by hand once paddle is chosen, and one undo takes the type and the legs back', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      act(() => result.current.setTourType('kayak'));
      expect(result.current.isPaddle).toBe(true);
      expect(result.current.waypoints.map((point) => point.fixedLeg?.kind)).toEqual(['free', 'free', undefined]);
      act(() => result.current.addWaypoint(48.03, 11.01));
      expect(result.current.waypoints[2].fixedLeg?.kind).toBe('free');
      act(() => result.current.undo());
      act(() => result.current.undo());
      expect(result.current.tourType).toBe('hike');
      expect(result.current.waypoints.map((point) => point.fixedLeg)).toEqual([undefined, undefined, undefined]);
    });

    it('holds Save back until a boat and the water are chosen, then saves them without a hiking limit', async () => {
      createTour.mockResolvedValue({ tour: { ...savedTour, tour_type: 'kayak' }, waypoints: [] });
      routeWalkingTour.mockResolvedValue({ ...routed, parts: [{ ...routed.parts[0], free: true }] });
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setName('Lake'));
      act(() => result.current.setTourType('kayak'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(result.current.paddleIncomplete).toBe(true);
      expect(result.current.canSave).toBe(false);

      act(() => result.current.paddle.setBoatType('canoe'));
      act(() => result.current.paddle.setWaterContext('lake'));
      expect(result.current.canSave).toBe(true);
      await act(async () => {
        await result.current.save();
      });
      expect(createTour.mock.calls[0][1]).toMatchObject({
        tour_type: 'kayak',
        boat_type: 'canoe',
        water_context: 'lake',
        paddle_speed_kmh: null,
        max_hiking_difficulty: null,
      });
    });

    it('times the water at the boat speed, keeps a chosen speed when the boat changes, and takes the suggestion only on purpose', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setTourType('kayak'));
      act(() => result.current.paddle.setBoatType('kayak'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      const distanceKm = result.current.routeAnalysis?.distanceKm ?? 0;
      expect(result.current.walkingDurationMinutes).toBe(Math.round((distanceKm / 4) * 60));

      act(() => result.current.paddle.setSpeedKmh(6));
      act(() => result.current.paddle.setBoatType('other'));
      expect(result.current.paddle.speedKmh).toBe(6);
      expect(result.current.walkingDurationMinutes).toBe(Math.round((distanceKm / 6) * 60));

      act(() => result.current.paddle.adoptRecommendedSpeed());
      expect(result.current.paddle.recommendedSpeedKmh).toBeNull();
      expect(result.current.walkingDurationMinutes).toBeNull();
    });

    it('refuses a speed outside what a paddler can enter', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setTourType('kayak'));
      act(() => result.current.paddle.setSpeedKmh(Number.NaN));
      expect(result.current.paddleSpeedInvalid).toBe(true);
      act(() => result.current.paddle.setSpeedKmh(30));
      expect(result.current.paddleSpeedInvalid).toBe(true);
    });

    it('opens a saved paddle tour with its boat, and a draft from before the type existed as a hike', async () => {
      detailTour.mockResolvedValue({
        tour: {
          ...savedTour,
          tour_type: 'kayak',
          max_hiking_difficulty: null,
          boat_type: 'sup',
          water_context: 'river',
          paddle_speed_kmh: 3,
        },
        waypoints: [
          {
            lat: 48,
            lng: 11,
            role: 'start',
            sequence: 0,
            fixed_leg: {
              kind: 'free',
              geometry: [
                [48, 11],
                [48.01, 11.02],
              ],
            },
          },
          { lat: 48.01, lng: 11.02, role: 'end', sequence: 1 },
        ],
      });
      const { result } = renderHook(() => useTourPlanner({ tripId: 31 }));
      await act(async () => {
        await result.current.openTour({ ...savedTour, tour_type: 'kayak' });
      });
      expect(result.current.tourType).toBe('kayak');
      expect(result.current.paddle).toMatchObject({ boatType: 'sup', waterContext: 'river', speedKmh: 3 });

      localStorage.setItem('tour-draft-32', JSON.stringify({ version: 6, name: 'Old', waypoints: [] }));
      const old = renderHook(() => useTourPlanner({ tripId: 32 }));
      expect(old.result.current.tourType).toBe('hike');
      expect(old.result.current.name).toBe('Old');
    });
  });
});
