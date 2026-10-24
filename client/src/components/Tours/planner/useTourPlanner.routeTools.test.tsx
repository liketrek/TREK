import { act, renderHook } from '@testing-library/react';
import type { TourCreateRequest, TourCreateResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  routeWalkingTour,
  routeCityWalk,
  enrichTourElevations,
  createTour,
  detailTour,
  updateTour,
  paddlePlan,
  paddleForget,
  findRoundHikes,
} = vi.hoisted(() => ({
  routeWalkingTour: vi.fn(),
  routeCityWalk: vi.fn(),
  enrichTourElevations: vi.fn(),
  createTour: vi.fn(),
  detailTour: vi.fn(),
  updateTour: vi.fn(),
  paddlePlan: vi.fn(),
  paddleForget: vi.fn(),
  findRoundHikes: vi.fn(),
}));

vi.mock('./tourRouting', () => ({ routeWalkingTour, routeCityWalk, enrichTourElevations }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { create: createTour, detail: detailTour, update: updateTour } }));
vi.mock('./roundHikeRouting', () => ({ findRoundHikes, MAX_ROUND_ASKS: 12 }));
vi.mock('../../../repo/paddleRouteRepo', () => ({ paddleRouteRepo: { plan: paddlePlan, forget: paddleForget } }));
vi.mock('../../../repo/tourDraftRepo', async () => ({
  tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
}));
vi.mock('../useTourPermissions', () => ({
  useTourPermissions: ({ canEdit = true, canAssign = true }: { canEdit?: boolean; canAssign?: boolean }) => ({
    canEdit,
    canAssign,
  }),
}));

import { draftStore } from '../../../../tests/helpers/fakeTourDraftRepo';
import { useTourPlanner } from './useTourPlanner';

/** The value, or a failure saying it is missing instead of a later undefined. */
function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

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

type LegAsked = { from: { lat: number; lng: number }; to: { lat: number; lng: number } };
/** The water router's answer for every leg asked: a straight stretch on the water, 1.2 km long. */
const onWater = (legs: LegAsked[]) =>
  legs.map(({ from, to }) => ({
    status: 'ok' as const,
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    segments: [{ kind: 'water' as const, from: 0, to: 1 }],
    distance_m: 1200,
    snapped_m: { from: 0, to: 0 },
  }));

const coordinatesOf = (points: Array<{ lat: number; lng: number }>) => points.map((point) => [point.lat, point.lng]);

describe('useTourPlanner route tools', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    draftStore.clear();
    routeWalkingTour.mockReset().mockResolvedValue(routed);
    routeCityWalk.mockReset().mockResolvedValue(routed);
    paddlePlan.mockReset().mockImplementation(async (_trip: number, legs: LegAsked[]) => onWater(legs));
    paddleForget.mockReset();
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
    it('plans every leg on the water once paddle is chosen, and one undo takes the type back', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      act(() => result.current.setTourType('kayak'));
      expect(result.current.isPaddle).toBe(true);
      expect(result.current.waypoints.map((point) => point.fixedLeg)).toEqual([undefined, undefined, undefined]);
      routeWalkingTour.mockClear();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(routeWalkingTour).not.toHaveBeenCalled();
      expect(paddlePlan).toHaveBeenLastCalledWith(
        31,
        expect.any(Array),
        { boat: 'kayak', lakeStyle: 'direct' },
        expect.any(AbortSignal)
      );
      expect(result.current.status).toBe('ready');
      expect(result.current.paddleRoute?.legLengths).toEqual([1200, 1200]);
      act(() => result.current.addWaypoint(48.03, 11.01));
      expect(result.current.waypoints[2].fixedLeg).toBeUndefined();
      act(() => result.current.undo());
      act(() => result.current.undo());
      expect(result.current.tourType).toBe('hike');
      expect(result.current.waypoints.map((point) => point.fixedLeg)).toEqual([undefined, undefined, undefined]);
    });

    it('holds Save back until a boat and the water are chosen, then saves them without a hiking limit', async () => {
      createTour.mockResolvedValue({ tour: { ...savedTour, tour_type: 'kayak' }, waypoints: [] });
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
      // A route planned for another boat is not this one's: Save waits for the canoe's.
      expect(result.current.canSave).toBe(false);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(result.current.canSave).toBe(true);
      await act(async () => {
        await result.current.save();
      });
      expect(createTour.mock.calls[0][1]).toMatchObject({
        tour_type: 'kayak',
        boat_type: 'canoe',
        water_context: 'lake',
        paddle_speed_kmh: null,
        paddle_lake_style: 'direct',
        max_hiking_difficulty: null,
      });
      // A paddle tour carries no heights to look up.
      expect(enrichTourElevations).not.toHaveBeenCalled();
    });

    it('times the water by the routed length at the boat speed, keeps a chosen speed when the boat changes, and takes the suggestion only on purpose', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setTourType('kayak'));
      act(() => result.current.paddle.setBoatType('kayak'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      // 1.2 km on the water the router found, at 4 km/h.
      expect(result.current.walkingDurationMinutes).toBe(18);

      act(() => result.current.paddle.setSpeedKmh(6));
      act(() => result.current.paddle.setBoatType('other'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(result.current.paddle.speedKmh).toBe(6);
      expect(result.current.walkingDurationMinutes).toBe(12);

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

      draftStore.setItem('tour-draft-32', JSON.stringify({ version: 6, name: 'Old', waypoints: [] }));
      const old = renderHook(() => useTourPlanner({ tripId: 32 }));
      await act(async () => {});
      expect(old.result.current.tourType).toBe('hike');
      expect(old.result.current.name).toBe('Old');
    });
  });

  describe('shaping and water routing (P2A-03, P2A-05, PAD-11)', () => {
    const settle = () =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });

    it('sets a shaping point into a leg, makes it a stop and back, and never past the end', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.02, 11.02],
      ]);
      const [start, end] = result.current.waypoints;
      let id: string | null = null;
      act(() => {
        id = result.current.insertShapingPoint(must(start).id, 48.01, 11.005);
      });
      expect(result.current.waypoints.map((point) => !!point.shaping)).toEqual([false, true, false]);
      expect(result.current.waypoints[1]?.id).toBe(id);
      act(() => {
        expect(result.current.insertShapingPoint(must(end).id, 48.03, 11.03)).toBeNull();
        expect(result.current.insertShapingPoint(must(start).id, Number.NaN, 11)).toBeNull();
      });
      act(() => result.current.setWaypointShaping(must(id), false));
      expect(result.current.waypoints[1]).not.toHaveProperty('shaping');
      act(() => result.current.setWaypointShaping(must(start).id, true));
      expect(result.current.waypoints[0]).not.toHaveProperty('shaping');
      // One undo takes back one change.
      act(() => result.current.undo());
      expect(result.current.waypoints[1]?.shaping).toBe(true);
      await settle();
      expect(routeWalkingTour).toHaveBeenLastCalledWith(
        expect.arrayContaining([expect.objectContaining({ shaping: true })]),
        expect.any(AbortSignal),
        2,
        null
      );
    });

    it('holds a way chosen for a leg by its shaping points as one step, which one undo takes back (RTE-02)', () => {
      const { result } = plannerWith([
        [48, 11],
        [48.02, 11.02],
        [48.04, 11],
      ]);
      const [start, middle] = result.current.waypoints;
      const pins = [
        { lat: 48.005, lng: 11.01 },
        { lat: 48.012, lng: 11.015 },
      ];
      let ids: string[] | null = null;
      act(() => {
        ids = result.current.insertShapingPoints(must(start).id, must(middle).id, pins);
      });
      expect(result.current.waypoints.map((point) => !!point.shaping)).toEqual([false, true, true, false, false]);
      expect(result.current.waypoints.slice(1, 3).map((point) => point.id)).toEqual(ids);
      expect(coordinatesOf(result.current.waypoints.slice(1, 3))).toEqual(pins.map((pin) => [pin.lat, pin.lng]));
      act(() => {
        // No longer neighbours, or a spot that is none: nothing is written.
        expect(result.current.insertShapingPoints(must(start).id, must(middle).id, pins)).toBeNull();
        expect(result.current.insertShapingPoints(must(middle).id, 'gone', pins)).toBeNull();
        expect(
          result.current.insertShapingPoints(must(start).id, must(ids)[0], [{ lat: Number.NaN, lng: 11 }])
        ).toBeNull();
      });
      expect(result.current.legVariants.comparison).toBeNull();
      act(() => result.current.undo());
      expect(result.current.waypoints).toHaveLength(3);
    });

    it('plans a leg afresh: a paddle leg is forgotten and asked again, a fixed leg is left alone', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setTourType('kayak'));
      await settle();
      expect(paddlePlan).toHaveBeenCalledTimes(1);
      const [start, end] = result.current.waypoints;
      act(() => result.current.recomputeLeg(must(start).id));
      expect(paddleForget).toHaveBeenCalledWith(31, start, end, { boat: 'kayak', lakeStyle: 'direct' });
      await settle();
      expect(paddlePlan).toHaveBeenCalledTimes(2);
      act(() => result.current.recomputeLeg(must(end).id));
      expect(paddleForget).toHaveBeenCalledTimes(1);
    });

    it('sends every leg drawn by hand back to the water router in one step', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      act(() => result.current.setTourType('kayak'));
      for (const point of result.current.waypoints.slice(0, 2))
        act(() => result.current.toggleWaypointFreeLeg(point.id));
      expect(result.current.waypoints.map((point) => point.fixedLeg?.kind)).toEqual(['free', 'free', undefined]);
      act(() => result.current.routeDrawnLegsOnWater());
      expect(result.current.waypoints.map((point) => point.fixedLeg)).toEqual([undefined, undefined, undefined]);
      act(() => result.current.undo());
      expect(result.current.waypoints[0]?.fixedLeg?.kind).toBe('free');
    });

    it('keeps a tour with an unplanned leg from being saved, and says it per leg', async () => {
      paddlePlan.mockImplementation(async (_trip: number, legs: LegAsked[]) =>
        legs.map(() => ({ status: 'failed', code: 'not_on_water', at: { lat: 48.01, lng: 11.02 } }))
      );
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
      ]);
      act(() => result.current.setName('Off the water'));
      act(() => result.current.setTourType('kayak'));
      act(() => result.current.paddle.setBoatType('kayak'));
      act(() => result.current.paddle.setWaterContext('river'));
      await settle();
      expect(result.current.status).toBe('routing-failed');
      expect(result.current.error).toBe('paddle-route');
      expect(result.current.paddleRoute?.failures).toEqual([
        { index: 0, code: 'not_on_water', at: { lat: 48.01, lng: 11.02 } },
      ]);
      expect(result.current.routeCurrent).toBe(true);
      expect(result.current.canSave).toBe(false);
    });

    it('sets the portage and the lock the router found as points of their own, and they go when their leg changes', async () => {
      paddlePlan.mockImplementation(async (_trip: number, legs: LegAsked[]) =>
        legs.map(({ from, to }) => {
          const mid = (a: number, b: number, t: number) => a + (b - a) * t;
          const at = (t: number): [number, number] => [mid(from.lat, to.lat, t), mid(from.lng, to.lng, t)];
          const geometry = [at(0), at(0.3), at(0.4), at(1)];
          const segments = [
            { kind: 'water', from: 0, to: 1 },
            { kind: 'portage', from: 1, to: 2, source: 'tagged' },
            { kind: 'water', from: 2, to: 3 },
          ].map((segment) => ({ name: null, source: null, osm_ref: null, grade: null, ...segment }));
          return { status: 'ok', geometry, segments, distance_m: 3000, snapped_m: { from: 0, to: 0 } };
        })
      );
      const { result } = plannerWith([
        [48, 11],
        [48.1, 11],
      ]);
      act(() => result.current.setTourType('kayak'));
      await settle();
      await settle();
      expect(result.current.waypoints).toHaveLength(4);
      expect(result.current.waypoints[1]).toMatchObject({ fixedLeg: { kind: 'portage' } });
      expect(result.current.waypoints.filter((point) => point.auto)).toHaveLength(2);
      // Found by the router, not done by the paddler: no step of the history of its own.
      act(() => result.current.undo());
      expect(result.current.tourType).toBe('hike');
      act(() => result.current.redo());
      await settle();
      await settle();
      const end = result.current.waypoints[result.current.waypoints.length - 1];
      act(() => {
        void result.current.setWaypointPosition(end.id, 48.2, 11);
      });
      await settle();
      expect(result.current.waypoints.filter((point) => point.auto).every((point) => point.auto?.to.lat === 48.2)).toBe(
        true
      );
    });
  });

  describe('round hikes (RTE-03)', () => {
    it('puts a round taken in place of the plan as one step after a yes, which one undo takes back', async () => {
      const via = [
        { lat: 48.01, lng: 11 },
        { lat: 48.02, lng: 11.01 },
        { lat: 48.01, lng: 11.02 },
      ];
      const round = {
        key: 'a',
        current: false,
        coordinates: [[48, 11], ...via.map(({ lat, lng }) => [lat, lng]), [48, 11]],
        distanceM: 9_800,
        gainM: 300,
        lossM: 300,
        minutes: 170,
        heights: 'known',
        via,
      };
      findRoundHikes.mockImplementation(
        async (_request: unknown, _signal: AbortSignal, report: (answer: unknown) => void) => {
          await Promise.resolve();
          report({ phase: 'done', candidates: [round], asked: 3 });
        }
      );
      const { result } = plannerWith([
        [48, 11],
        [48.03, 11.03],
      ]);
      const before = coordinatesOf(result.current.waypoints);
      const start = must(result.current.waypoints[0]);
      act(() => result.current.roundHikes.open(start.id));
      act(() => result.current.roundHikes.find(10_000));
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.roundHikes.view?.phase).toBe('done');
      act(() => result.current.roundHikes.select('a'));
      act(() => result.current.roundHikes.apply());
      // The tour held more than its start: nothing changes before the yes.
      expect(coordinatesOf(result.current.waypoints)).toEqual(before);
      act(() => result.current.roundHikes.confirm());

      expect(result.current.isLoop).toBe(true);
      expect(must(result.current.waypoints[0]).id).toBe(start.id);
      expect(result.current.waypoints.map((point) => !!point.shaping)).toEqual([false, true, true, true, false]);
      expect(coordinatesOf(result.current.waypoints)).toEqual([[48, 11], ...coordinatesOf(via), [48, 11]]);
      expect(result.current.waypoints.map((point) => point.role)).toEqual(['start', 'via', 'via', 'via', 'end']);
      expect(result.current.roundHikes.appliedHint.shown).toBe(true);

      act(() => result.current.undo());
      expect(coordinatesOf(result.current.waypoints)).toEqual(before);
    });
  });

  describe("a city walk's keys and stops (CW-02, CW-03)", () => {
    /** The server's answer to a save: the points in their order, a key sent kept, one missing made up. */
    const answered = (body: TourCreateRequest, revision: number): TourCreateResponse => ({
      tour: { ...savedTour, tour_type: 'walk', revision },
      waypoints: body.waypoints.map((point, index) => ({ ...point, key: point.key ?? `new-${revision}-${index}` })),
    });
    /** The keys of the points a create or an update sent, the body being its last argument. */
    const keysSent = (call: unknown[] | undefined) =>
      (call?.[call.length - 1] as TourCreateRequest).waypoints.map((point) => point.key);

    /** A walk through these points, named and routed, ready to save. */
    async function walkPlanned(points: Array<[number, number]>) {
      createTour.mockImplementation(async (_trip: number, body: TourCreateRequest) => answered(body, 1));
      updateTour.mockImplementation(async (_trip: number, _place: number, body: TourCreateRequest) =>
        answered(body, (updateTour.mock.calls.length as number) + 1)
      );
      const hook = plannerWith(points);
      act(() => hook.result.current.setTourType('walk'));
      act(() => hook.result.current.setName('Old town'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      return hook;
    }

    it('sends the keys a save answered with the next save, and plans no route again for them', async () => {
      const { result } = await walkPlanned([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      const routings = routeCityWalk.mock.calls.length;
      await act(async () => {
        await result.current.save();
      });
      expect(keysSent(createTour.mock.calls[0])).toEqual([undefined, undefined, undefined]);
      expect(result.current.waypoints.map((point) => point.key)).toEqual(['new-1-0', 'new-1-1', 'new-1-2']);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(routeCityWalk).toHaveBeenCalledTimes(routings);
      expect(result.current.status).toBe('saved');
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.canUndo).toBe(false);

      act(() => result.current.setName('Old town at dusk'));
      await act(async () => {
        await result.current.save();
      });
      expect(keysSent(updateTour.mock.calls[0])).toEqual(['new-1-0', 'new-1-1', 'new-1-2']);
    });

    it("closes a walk without the start's key, and the way back keeps the key it was given", async () => {
      const { result } = await walkPlanned([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      await act(async () => {
        await result.current.save();
      });
      act(() => result.current.returnToStart());
      expect(result.current.waypoints.map((point) => point.key)).toEqual(['new-1-0', 'new-1-1', 'new-1-2', undefined]);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      await act(async () => {
        await result.current.save();
      });
      expect(result.current.waypoints.map((point) => point.key)).toEqual(['new-1-0', 'new-1-1', 'new-1-2', 'new-2-3']);

      act(() => result.current.setName('Round the old town'));
      await act(async () => {
        await result.current.save();
      });
      expect(keysSent(updateTour.mock.calls[1])).toEqual(['new-1-0', 'new-1-1', 'new-1-2', 'new-2-3']);
    });

    it("takes a stop's stay from its dialog as a step of its own and saves it, without routing the walk again", async () => {
      const { result } = await walkPlanned([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      const routings = routeCityWalk.mock.calls.length;
      const stop = must(result.current.waypoints[1]);
      act(() =>
        result.current.editWaypoints((points) =>
          points.map((point) => (point.id === stop.id ? { ...point, name: 'Market', stayMinutes: 45 } : point))
        )
      );
      expect(result.current.waypoints[1]).toMatchObject({ name: 'Market', stayMinutes: 45 });
      expect(result.current.stationStays?.stayMinutes).toBe(45);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(routeCityWalk).toHaveBeenCalledTimes(routings);
      expect(result.current.status).toBe('ready');
      expect(result.current.canSave).toBe(true);

      act(() => result.current.undo());
      expect(result.current.waypoints[1]?.stayMinutes).toBeUndefined();
      act(() => result.current.redo());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(routeCityWalk).toHaveBeenCalledTimes(routings);
      await act(async () => {
        await result.current.save();
      });
      expect((createTour.mock.calls[0]?.[1] as TourCreateRequest).waypoints[1]).toMatchObject({
        name: 'Market',
        stay_minutes: 45,
      });
    });

    it('names a point of a paddle tour without planning the water again', async () => {
      const { result } = plannerWith([
        [48, 11],
        [48.01, 11.02],
        [48.02, 11],
      ]);
      act(() => result.current.setTourType('kayak'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      const plans = paddlePlan.mock.calls.length;
      act(() =>
        result.current.editWaypoints((points) =>
          points.map((point, index) => (index === 1 ? { ...point, name: 'Boathouse' } : point))
        )
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
      expect(paddlePlan).toHaveBeenCalledTimes(plans);
      expect(result.current.waypoints[1]?.name).toBe('Boathouse');
      expect(result.current.status).toBe('ready');
    });
  });
});
