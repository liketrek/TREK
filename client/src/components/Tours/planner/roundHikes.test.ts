// FE-TOUR-ROUND-HIKES-002 to FE-TOUR-ROUND-HIKES-007: the model of round hikes out of a stop,
// when a round fits the wish, what a search asks and the plan a chosen round becomes (RTE-03).
import { isClosedLoop } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { haversineKm } from '../../../utils/geo';
import {
  canStartRound,
  metersTyped,
  roundPlanOf,
  roundRequestOf,
  roundStarts,
  searchAreaOf,
  typedLength,
} from './roundHikes';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const A: TourPlannerWaypoint = { id: 'a', lat: 47.5, lng: 11.1, role: 'start', name: 'Hut', linkedPlaceId: 7 };
const S: TourPlannerWaypoint = { id: 's', lat: 47.51, lng: 11.11, role: 'via', shaping: true };
const B: TourPlannerWaypoint = { id: 'b', lat: 47.52, lng: 11.12, role: 'end' };
const BACK: TourPlannerWaypoint = { id: 'back', lat: 47.5, lng: 11.1, role: 'end' };
const COSTING = { max_hiking_difficulty: 2 };

describe('the wished length', () => {
  it('FE-TOUR-ROUND-HIKES-002: a length is typed in either unit', () => {
    expect(metersTyped('12,5', 'metric')).toBe(12_500);
    expect(metersTyped(' 10 ', 'metric')).toBe(10_000);
    expect(metersTyped('', 'metric')).toBeNull();
    expect(metersTyped('ten', 'metric')).toBeNull();
    expect(metersTyped('5', 'imperial')).toBeCloseTo(8_046.7, 0);
    expect(typedLength(10_000, 'metric')).toBe('10');
    expect(typedLength(10_000, 'imperial')).toBe('6.2');
  });
});

describe('the start', () => {
  it('FE-TOUR-ROUND-HIKES-003: a round starts from a stop of a hike, never a shaping point or the way back of a loop', () => {
    expect(roundStarts([A, S, B]).map((point) => point.id)).toEqual(['a', 'b']);
    expect(roundStarts([A, S, B, BACK]).map((point) => point.id)).toEqual(['a', 'b']);
    expect(canStartRound([A, S, B], 'a', 'hike')).toBe(true);
    expect(canStartRound([A, S, B], 's', 'hike')).toBe(false);
    expect(canStartRound([A, S, B, BACK], 'back', 'hike')).toBe(false);
    expect(canStartRound([A, S, B], 'gone', 'hike')).toBe(false);
    expect(canStartRound([A, S, B], 'a', 'bike')).toBe(false);
    expect(canStartRound([A], 'a', 'hike')).toBe(true);
  });

  it('FE-TOUR-ROUND-HIKES-004: a search holds its start, length and rules in its key', () => {
    const request = roundRequestOf([A, B], 'a', 'hike', COSTING, 10_000);
    expect(request).toMatchObject({ startId: 'a', start: { lat: 47.5, lng: 11.1 }, targetM: 10_000, costing: COSTING });
    const moved = roundRequestOf([{ ...A, lat: 47.6 }, B], 'a', 'hike', COSTING, 10_000);
    const longer = roundRequestOf([A, B], 'a', 'hike', COSTING, 12_000);
    const harder = roundRequestOf([A, B], 'a', 'hike', { max_hiking_difficulty: 4 }, 10_000);
    expect(new Set([request?.key, moved?.key, longer?.key, harder?.key]).size).toBe(4);
    expect(roundRequestOf([A, B], 'a', 'hike', COSTING, 10_000)?.key).toBe(request?.key);
    expect(roundRequestOf([A, B], 'a', 'walk', COSTING, 10_000)).toBeNull();
    expect(roundRequestOf([A, B], 'a', 'hike', COSTING, 100)).toBeNull();
  });
});

describe('the plan a round becomes', () => {
  it('FE-TOUR-ROUND-HIKES-005: the start as it was, the steering spots as shaping points, and the way back onto the start', () => {
    let next = 0;
    const via = [
      { lat: 47.51, lng: 11.1 },
      { lat: 47.52, lng: 11.11 },
      { lat: 47.51, lng: 11.12 },
    ];
    const start = { ...A, fixedLeg: { kind: 'free' as const, geometry: [] }, role: 'via' as const };
    const plan = roundPlanOf(start, via, () => `n${(next += 1)}`);
    expect(plan.map((point) => point.id)).toEqual(['a', 'n1', 'n2', 'n3', 'n4']);
    expect(plan[0]).toMatchObject({ id: 'a', name: 'Hut', linkedPlaceId: 7, role: 'start' });
    expect(plan[0].fixedLeg).toBeUndefined();
    expect(plan.slice(1, 4).every((point) => point.shaping === true)).toBe(true);
    expect(plan.slice(1, 4).map(({ lat, lng }) => ({ lat, lng }))).toEqual(via);
    expect(plan[4]).toMatchObject({ lat: A.lat, lng: A.lng });
    // The way back is no station: it does not carry the start's name.
    expect(plan[4].name).toBeUndefined();
    expect(isClosedLoop(plan)).toBe(true);
  });

  it('FE-TOUR-ROUND-HIKES-006: a plan from a shaping or loose start drops what only steered or was the start’s own leg', () => {
    const plan = roundPlanOf({ ...S, carryNext: true, lock: null }, [{ lat: 47.6, lng: 11.2 }], () => 'x');
    expect(plan[0].shaping).toBeUndefined();
    expect(plan[0].carryNext).toBeUndefined();
    expect(plan[0].lock).toBeUndefined();
  });
});

describe('searchAreaOf', () => {
  it('FE-TOUR-ROUND-HIKES-007: frames how far the longest fitting round strays from its start', () => {
    const area = searchAreaOf(A, 10_000);
    expect(area).toHaveLength(4);
    for (const [lat, lng] of area) expect(haversineKm(A, { lat, lng })).toBeCloseTo(3.6, 1);
  });
});
