// FE-TOUR-WAYPOINTS-001 to FE-TOUR-WAYPOINTS-005: the editor's waypoint model, shaping points and drawn legs (P2A-03, PAD-11).
import { describe, expect, it } from 'vitest';
import {
  normalizePlannerWaypoints,
  sameWaypointSnapshot,
  tourWaypointKey,
  withDrawnLegsRouted,
  withShaping,
  withShapingPoint,
  type TourPlannerWaypoint,
} from './tourPlannerWaypoints';

const A: TourPlannerWaypoint = { id: 'a', lat: 49, lng: 12, role: 'start' };
const B: TourPlannerWaypoint = { id: 'b', lat: 49.01, lng: 12.01, role: 'via' };
const C: TourPlannerWaypoint = { id: 'c', lat: 49.02, lng: 12.02, role: 'end' };

describe('tourPlannerWaypoints', () => {
  it('FE-TOUR-WAYPOINTS-001: a shaping point goes into the leg after the point named, and nowhere past the end', () => {
    const shaped = withShapingPoint([A, B, C], 'b', { id: 's', lat: 49.015, lng: 12.015 });
    expect(shaped.map((point) => point.id)).toEqual(['a', 'b', 's', 'c']);
    expect(shaped[2]).toEqual({ id: 's', lat: 49.015, lng: 12.015, role: 'via', shaping: true });
    const points = [A, B, C];
    expect(withShapingPoint(points, 'c', { id: 's', lat: 0, lng: 0 })).toBe(points);
    expect(withShapingPoint(points, 'missing', { id: 's', lat: 0, lng: 0 })).toBe(points);
  });

  it('FE-TOUR-WAYPOINTS-002: a stop becomes a shaping point and back; the ends always stay stops', () => {
    const shaped = withShaping([A, B, C], 'b', true);
    expect(shaped[1]?.shaping).toBe(true);
    expect(withShaping(shaped, 'b', false)[1]).not.toHaveProperty('shaping');
    expect(withShaping([A, B, C], 'a', true)[0]).toBe(A);
    expect(withShaping([A, B, C], 'c', true)[2]).toBe(C);
  });

  it('FE-TOUR-WAYPOINTS-003: every drawn leg goes back to the router; a portage stays', () => {
    const free = {
      kind: 'free' as const,
      geometry: [
        [49, 12],
        [49.01, 12.01],
      ] as [number, number][],
    };
    const carried = {
      kind: 'portage' as const,
      geometry: [
        [49.01, 12.01],
        [49.02, 12.02],
      ] as [number, number][],
      extra_minutes: 5,
    };
    const routed = withDrawnLegsRouted([{ ...A, fixedLeg: free }, { ...B, fixedLeg: carried }, C]);
    expect(routed[0]).not.toHaveProperty('fixedLeg');
    expect(routed[1]?.fixedLeg).toEqual(carried);
  });

  it('FE-TOUR-WAYPOINTS-004: the key changes when a point shapes instead of stops, or a line gains a bend', () => {
    const key = tourWaypointKey([A, B, C]);
    expect(tourWaypointKey(withShaping([A, B, C], 'b', true))).not.toBe(key);
    const two = {
      kind: 'free' as const,
      geometry: [
        [49, 12],
        [49.01, 12.01],
      ] as [number, number][],
    };
    const three = {
      kind: 'free' as const,
      geometry: [
        [49, 12],
        [49.005, 12.0],
        [49.01, 12.01],
      ] as [number, number][],
    };
    expect(tourWaypointKey([{ ...A, fixedLeg: two }, B])).not.toBe(tourWaypointKey([{ ...A, fixedLeg: three }, B]));
  });

  it('FE-TOUR-WAYPOINTS-005: a point the router set is part of the snapshot, and roles follow the order', () => {
    const auto = { from: { id: 'a', lat: 49, lng: 12 }, to: { id: 'c', lat: 49.02, lng: 12.02 } };
    expect(sameWaypointSnapshot([A, B, C], [A, { ...B, auto }, C])).toBe(false);
    expect(sameWaypointSnapshot([A, B, C], [A, B, C])).toBe(true);
    expect(normalizePlannerWaypoints([C, A, B]).map((point) => point.role)).toEqual(['start', 'via', 'end']);
  });
});
