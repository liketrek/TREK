import { isClosedLoop } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import {
  alignFreeLegs,
  closeLoop,
  freeLegBetween,
  portageLegBetween,
  reverseRoute,
  setPortageExtraMinutes,
  setWaypointLock,
  toggleFreeLeg,
  togglePortageLeg,
  type RoutePoint,
} from './tourRouteActions';

const A: RoutePoint = { id: 'a', lat: 47, lng: 11 };
const B: RoutePoint = { id: 'b', lat: 47.01, lng: 11.01 };
const C: RoutePoint = { id: 'c', lat: 47.02, lng: 11.03 };
const FERRATA = {
  kind: 'ferrata' as const,
  ref: 'way/1',
  name: 'Via',
  geometry: [
    [47.01, 11.01],
    [47.015, 11.02],
    [47.02, 11.03],
  ] as [number, number][],
};

describe('closeLoop (PR1-01)', () => {
  it('adds one end on the start, under a new id, and keeps every stop', () => {
    const closed = closeLoop([A, B, C], 'back');
    expect(closed.map((point) => point.id)).toEqual(['a', 'b', 'c', 'back']);
    expect(closed[3]).toMatchObject({ lat: A.lat, lng: A.lng });
    expect(isClosedLoop(closed)).toBe(true);
  });

  it('does not copy the start a second time, or close a tour with one point', () => {
    const closed = closeLoop([A, B, C], 'back');
    expect(closeLoop(closed, 'again')).toEqual(closed);
    expect(closeLoop([A], 'back')).toEqual([A]);
  });

  it('does not carry the start leg onto the return point', () => {
    const closed = closeLoop([{ ...A, fixedLeg: freeLegBetween(A, B) }, B], 'back');
    expect(closed[2].fixedLeg).toBeUndefined();
  });

  it("takes none of a city walk's start station onto the way back, only its spot and the place it stands for", () => {
    const cathedral: TourPlannerWaypoint = {
      ...A,
      role: 'start',
      key: 'stop-cathedral',
      name: 'Cathedral',
      stayMinutes: 30,
      importance: 'must',
      protected: true,
      openingHours: 'Mo-Su 09:00-18:00',
      linkedPlaceId: 7,
    };
    const closed = closeLoop<TourPlannerWaypoint>([cathedral, { ...B, role: 'via' }, { ...C, role: 'end' }], 'back');
    expect(closed[3]).toEqual({ id: 'back', lat: A.lat, lng: A.lng, role: 'start', linkedPlaceId: 7 });
    expect(closed[0]).toBe(cathedral);
  });
});

describe('reverseRoute (PR1-02)', () => {
  it('swaps start and end and runs the stops backwards', () => {
    expect(reverseRoute([A, B, C]).map((point) => point.id)).toEqual(['c', 'b', 'a']);
  });

  it('keeps a via ferrata on the stretch it covers, its line turned round', () => {
    const reversed = reverseRoute([A, { ...B, fixedLeg: FERRATA }, C]);
    expect(reversed.map((point) => point.id)).toEqual(['c', 'b', 'a']);
    expect(reversed[0].fixedLeg).toEqual({ ...FERRATA, geometry: [...FERRATA.geometry].reverse() });
    expect(reversed[1].fixedLeg).toBeUndefined();
    expect(reversed[2].fixedLeg).toBeUndefined();
  });

  it('keeps a loop a loop from the same spot', () => {
    const loop = closeLoop([A, B, C], 'back');
    const reversed = reverseRoute(loop);
    expect(reversed.map((point) => point.id)).toEqual(['back', 'c', 'b', 'a']);
    expect(isClosedLoop(reversed)).toBe(true);
  });

  it("keeps a city walk's start station first when its loop runs the other way, and the way back no station", () => {
    const start = { ...A, key: 'stop-a', name: 'Cathedral', stayMinutes: 30, importance: 'must', protected: true };
    const loop = closeLoop<RoutePoint & Partial<TourPlannerWaypoint>>(
      [start as RoutePoint & Partial<TourPlannerWaypoint>, B, C],
      'back'
    );
    const reversed = reverseRoute(loop);
    expect(reversed.map((point) => point.id)).toEqual(['back', 'c', 'b', 'a']);
    expect(reversed[0]).toEqual({
      id: 'back',
      lat: A.lat,
      lng: A.lng,
      key: 'stop-a',
      name: 'Cathedral',
      stayMinutes: 30,
      importance: 'must',
      protected: true,
    });
    expect(reversed[3]).toEqual({ id: 'a', lat: A.lat, lng: A.lng });
    expect(reverseRoute(reversed)).toEqual(loop);
  });

  it('twice is the tour as it was', () => {
    const route = [{ ...A, fixedLeg: freeLegBetween(A, B) }, { ...B, fixedLeg: FERRATA }, C];
    expect(reverseRoute(reverseRoute(route))).toEqual(route);
  });
});

describe('free legs (P2A-04)', () => {
  it('draws the leg after a point by hand, and routes it again on the second press', () => {
    const drawn = toggleFreeLeg([A, B, C], 'a');
    expect(drawn[0].fixedLeg).toEqual(freeLegBetween(A, B));
    expect(toggleFreeLeg(drawn, 'a')[0].fixedLeg).toBeUndefined();
  });

  it('leaves a via ferrata and the last point alone', () => {
    const route = [A, { ...B, fixedLeg: FERRATA }, C];
    expect(toggleFreeLeg(route, 'b')).toEqual(route);
    expect(toggleFreeLeg(route, 'c')).toEqual(route);
  });

  it('follows a moved point instead of tearing off', () => {
    const moved = alignFreeLegs([{ ...A, fixedLeg: freeLegBetween(A, B) }, { ...B, lat: 47.05 }, C]);
    expect(moved[0].fixedLeg).toEqual(freeLegBetween(A, { lat: 47.05, lng: B.lng }));
  });

  it('drops a free leg that leads nowhere, and keeps routed legs routed', () => {
    const aligned = alignFreeLegs([A, B, { ...C, fixedLeg: freeLegBetween(C, A) }]);
    expect(aligned.map((point) => point.fixedLeg)).toEqual([undefined, undefined, undefined]);
  });

  it('routes a paddle tour on the water: a via ferrata goes back to the router, a leg drawn by hand follows its points', () => {
    const aligned = alignFreeLegs([A, { ...B, fixedLeg: FERRATA }, C], true);
    expect(aligned.map((point) => point.fixedLeg?.kind)).toEqual([undefined, undefined, undefined]);
    const drawn = alignFreeLegs([{ ...A, fixedLeg: freeLegBetween(A, C) }, B, C], true);
    expect(drawn[0].fixedLeg).toEqual(freeLegBetween(A, B));
  });

  it('keeps the shape of a drawn paddle leg while its ends still meet their points, and redraws it once one moves', () => {
    const shaped = {
      kind: 'free' as const,
      geometry: [
        [A.lat, A.lng],
        [A.lat + 0.001, A.lng + 0.002],
        [B.lat, B.lng],
      ] as [number, number][],
    };
    expect(alignFreeLegs([{ ...A, fixedLeg: shaped }, B], true)[0].fixedLeg).toEqual(shaped);
    const moved = { ...B, lat: B.lat + 0.01 };
    expect(alignFreeLegs([{ ...A, fixedLeg: shaped }, moved, C], true)[0].fixedLeg).toEqual(freeLegBetween(A, moved));
  });
});

describe('portages and locks (PAD-03, PAD-07)', () => {
  const LOCK = { wait_minutes: 10, transit_minutes: null };

  it('carries the leg after a point and plans it on the water again on the second press', () => {
    const carried = togglePortageLeg(alignFreeLegs([A, B, C], true), 'a');
    expect(carried[0].fixedLeg).toEqual(portageLegBetween(A, B));
    expect(togglePortageLeg(carried, 'a')[0]).not.toHaveProperty('fixedLeg');
  });

  it('asks for a portage at the last point and draws it to the point set next', () => {
    const asked = togglePortageLeg(alignFreeLegs([A, B], true), 'b');
    expect(asked[1]).toMatchObject({ carryNext: true });
    // Redrawn with no point after it, the ask waits.
    expect(alignFreeLegs(asked, true)[1]).toMatchObject({ carryNext: true });
    const placed = alignFreeLegs([...asked, C], true);
    expect(placed[1].fixedLeg).toEqual(portageLegBetween(B, C));
    expect(placed[1]).not.toHaveProperty('carryNext');
    // A second press takes the ask back, and a hike forgets it.
    expect(togglePortageLeg(asked, 'b')[1]).not.toHaveProperty('carryNext');
    expect(alignFreeLegs([...asked, C])[1]).not.toHaveProperty('carryNext');
  });

  it('keeps a portage that follows a way while its ends stay, and draws it straight once one moves', () => {
    const geometry: [number, number][] = [
      [A.lat, A.lng],
      [47.004, 11.006],
      [B.lat, B.lng],
    ];
    const points: RoutePoint[] = [{ ...A, fixedLeg: { ...portageLegBetween(A, B), geometry } }, B, C];
    expect(alignFreeLegs(points, true)[0].fixedLeg).toEqual(points[0].fixedLeg);
    const moved = alignFreeLegs([points[0], { ...B, lat: 47.012 }, C], true);
    expect(moved[0].fixedLeg).toEqual(portageLegBetween(A, { lat: 47.012, lng: B.lng }));
  });

  it('keeps a portage and its time when a paddle tour is redrawn, and moves the time to the leg that leads it', () => {
    const points = [{ ...A, fixedLeg: portageLegBetween(A, B) }, { ...B, fixedLeg: portageLegBetween(B, C, 25) }, C];
    const aligned = alignFreeLegs(points, true);
    expect(aligned.map((point) => point.fixedLeg?.kind)).toEqual(['portage', 'portage', undefined]);
    expect(aligned[0].fixedLeg).toMatchObject({ extra_minutes: 25 });
    expect(aligned[1].fixedLeg).toMatchObject({ extra_minutes: null });
  });

  it('a hike carries no boat: a portage becomes a routed leg and a lock goes', () => {
    const aligned = alignFreeLegs([{ ...A, fixedLeg: portageLegBetween(A, B), lock: LOCK }, B]);
    expect(aligned[0]).toEqual(A);
  });

  it('sets the time out and in of a portage, and a lock with its times or none', () => {
    const carried = [{ ...A, fixedLeg: portageLegBetween(A, B) }, B];
    expect(setPortageExtraMinutes(carried, 'a', 12)[0].fixedLeg).toMatchObject({ extra_minutes: 12 });
    expect(setPortageExtraMinutes([A, B], 'a', 12)).toEqual([A, B]);
    const locked = setWaypointLock([A, B], 'b', LOCK);
    expect(locked[1].lock).toEqual(LOCK);
    expect(setWaypointLock(locked, 'b', null)[1]).toEqual(B);
  });

  it('closing a loop leaves the lock at the start, not on the way back', () => {
    const loop = closeLoop([{ ...A, lock: LOCK }, B, C], 'back');
    expect(loop[3]).toEqual({ id: 'back', lat: A.lat, lng: A.lng });
  });
});
