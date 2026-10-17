import { describe, expect, it } from 'vitest';
import {
  alignFreeLegs,
  closeLoop,
  freeLegBetween,
  isClosedLoop,
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

describe('isClosedLoop', () => {
  it('reads a loop from the points: the end on the spot of the start', () => {
    expect(isClosedLoop([A, B, { ...A, id: 'a2' }])).toBe(true);
    expect(isClosedLoop([A, B, C])).toBe(false);
  });

  it('is no loop with two points on one spot, or none', () => {
    expect(isClosedLoop([A, { ...A, id: 'a2' }])).toBe(false);
    expect(isClosedLoop([])).toBe(false);
  });
});

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

  it('draws every leg by hand for a paddle tour', () => {
    const aligned = alignFreeLegs([A, { ...B, fixedLeg: FERRATA }, C], true);
    expect(aligned.map((point) => point.fixedLeg?.kind)).toEqual(['free', 'free', undefined]);
    expect(aligned[1].fixedLeg).toEqual(freeLegBetween(B, C));
  });
});

describe('portages and locks (PAD-03, PAD-07)', () => {
  const LOCK = { wait_minutes: 10, transit_minutes: null };

  it('carries the leg after a point and paddles it again on the second press', () => {
    const carried = togglePortageLeg(alignFreeLegs([A, B, C], true), 'a');
    expect(carried[0].fixedLeg).toEqual(portageLegBetween(A, B));
    expect(togglePortageLeg(carried, 'a')[0].fixedLeg).toEqual(freeLegBetween(A, B));
    expect(togglePortageLeg(carried, 'c')).toEqual(carried);
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
