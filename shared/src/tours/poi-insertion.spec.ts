import {
  alongRouteM,
  chosenAfterId,
  defaultAfterId,
  insertionBlock,
  insertionPreview,
  insertionSlots,
  placesInTour,
  straightDetourM,
  withPointAfter,
  withPointAppended,
  type InsertionPoint,
} from './poi-insertion';

import { describe, expect, it } from 'vitest';

// TOUR-POI-INSERT-001 to TOUR-POI-INSERT-012, moved here from the planner with the module.

const point = (id: string, lat: number, lng: number, over: Partial<InsertionPoint> = {}): InsertionPoint => ({
  id,
  lat,
  lng,
  role: 'via',
  ...over,
});

const A = point('a', 47.0, 11.0, { role: 'start' });
const B = point('b', 47.01, 11.0);
const C = point('c', 47.02, 11.0, { role: 'end' });
const NEW = point('new', 47.005, 11.001);

describe('placing a found place in the tour (PLN-03)', () => {
  it('TOUR-POI-INSERT-001: goes in right after the point chosen, as a stop the router plans to', () => {
    expect(withPointAfter([A, B, C], 'a', NEW)?.map((p) => p.id)).toEqual(['a', 'new', 'b', 'c']);
    expect(withPointAfter([A, B, C], 'a', NEW)?.[1]).toMatchObject({ role: 'via' });
    // After the last point the tour goes on to it.
    expect(withPointAfter([A, B, C], 'c', NEW)?.map((p) => p.id)).toEqual(['a', 'b', 'c', 'new']);
  });

  it('TOUR-POI-INSERT-002: never cuts a fixed line or a stretch drawn by hand', () => {
    const ferrata = point('b', 47.01, 11.0, {
      fixedLeg: {
        kind: 'ferrata',
        ref: 'way/1',
        name: null,
        geometry: [
          [47.01, 11.0],
          [47.02, 11.0],
        ],
      },
    });
    const free = point('b', 47.01, 11.0, {
      fixedLeg: {
        kind: 'free',
        geometry: [
          [47.01, 11.0],
          [47.02, 11.0],
        ],
      },
    });
    expect(insertionBlock([A, ferrata, C], 'b')).toBe('fixed');
    expect(insertionBlock([A, free, C], 'b')).toBe('free');
    expect(withPointAfter([A, free, C], 'b', NEW)).toBeNull();
    expect(insertionBlock([A, free, C], 'a')).toBeNull();
  });

  it('TOUR-POI-INSERT-003: nothing goes after the way back of a loop, or after a point that is gone', () => {
    const back = point('back', 47.0, 11.0, { role: 'end' });
    expect(insertionBlock([A, B, back], 'back')).toBe('none');
    expect(insertionBlock([A, B, C], 'gone')).toBe('none');
    expect(withPointAfter([A, B, back], 'back', NEW)).toBeNull();
  });

  it('TOUR-POI-INSERT-004: suggests the last point before the place along the route', () => {
    const route: Array<[number, number]> = [
      [47.0, 11.0],
      [47.01, 11.0],
      [47.02, 11.0],
    ];
    // About 1.6 km along: after B (1.1 km), before C (2.2 km).
    expect(defaultAfterId([A, B, C], route, 1600)).toBe('b');
    expect(defaultAfterId([A, B, C], route, 100)).toBe('a');
    // Without a route the points themselves stand in for the line.
    expect(defaultAfterId([A, B, C], null, 1600)).toBe('b');
  });

  it('TOUR-POI-INSERT-005: skips a point that cannot take a stop, and has nothing to suggest without one', () => {
    const free = point('b', 47.01, 11.0, {
      fixedLeg: {
        kind: 'free',
        geometry: [
          [47.01, 11.0],
          [47.02, 11.0],
        ],
      },
    });
    expect(defaultAfterId([A, free, C], null, 1600)).toBe('a');
    expect(defaultAfterId([], null, 0)).toBeNull();
  });
});

describe('the slots a found place can go into (PLN-04)', () => {
  const back = point('back', 47.0, 11.0, { role: 'end' });

  it('TOUR-POI-INSERT-006: one slot per point, between it and the next, the last one as the new end', () => {
    expect(insertionSlots([A, B, C])).toEqual([
      { afterId: 'a', beforeId: 'b', block: null },
      { afterId: 'b', beforeId: 'c', block: null },
      { afterId: 'c', beforeId: null, block: null },
    ]);
    // A loop has no new end: the slot after its way back is listed as one that cannot take the place.
    expect(insertionSlots([A, B, back])[2]).toEqual({ afterId: 'back', beforeId: null, block: 'none' });
  });

  it('TOUR-POI-INSERT-007: the preview runs through the place to the next point, or ends on it as the new end', () => {
    const place = { lat: 47.03, lng: 11.0 };
    expect(insertionPreview([A, B, C], 'b', place)).toEqual([
      [47.01, 11.0],
      [47.03, 11.0],
      [47.02, 11.0],
    ]);
    expect(insertionPreview([A, B, C], 'c', place)).toEqual([
      [47.02, 11.0],
      [47.03, 11.0],
    ]);
    expect(insertionPreview([A, B, back], 'back', place)).toBeNull();
  });

  it('TOUR-POI-INSERT-008: the detour as the crow flies: the way round less the stretch it replaces', () => {
    // 1.11 km on to the place and 1.11 km back, instead of the 1.11 km between the points.
    const between = straightDetourM([
      [47.01, 11.0],
      [47.02, 11.0],
      [47.01, 11.0],
    ]);
    expect(between).toBeGreaterThan(2200);
    expect(between).toBeLessThan(2250);
    // A place on the way adds nothing.
    expect(
      straightDetourM([
        [47.0, 11.0],
        [47.01, 11.0],
        [47.02, 11.0],
      ]),
    ).toBeLessThan(1);
    // As the new end, the whole way to it.
    expect(
      straightDetourM([
        [47.02, 11.0],
        [47.03, 11.0],
      ]),
    ).toBeGreaterThan(1100);
  });

  it('TOUR-POI-INSERT-009: keeps the point picked for the place while it is there, the suggestion otherwise', () => {
    const place = { id: 'node:1', along_m: 1600 };
    expect(chosenAfterId([A, B, C], null, place, { poiId: 'node:1', afterId: 'c' })).toBe('c');
    // Picked for another place, or a point undone since.
    expect(chosenAfterId([A, B, C], null, place, { poiId: 'node:2', afterId: 'c' })).toBe('b');
    expect(chosenAfterId([A, B, C], null, place, { poiId: 'node:1', afterId: 'gone' })).toBe('b');
    expect(chosenAfterId([A, B, C], null, place, null)).toBe('b');
  });

  it('TOUR-POI-INSERT-010: tells the places that are a point of the tour already by their spot', () => {
    const places = [
      { id: 'node:1', lat: B.lat, lng: B.lng },
      { id: 'node:2', lat: B.lat + 0.001, lng: B.lng },
    ];
    expect([...placesInTour(places, [A, B, C])]).toEqual(['node:1']);
    expect(placesInTour(places, [A, C]).size).toBe(0);
  });
});

describe('a stop the assistant takes in (P6)', () => {
  it('TOUR-POI-INSERT-011: a new end goes after the last point, or before the way back of a loop', () => {
    const back = point('back', 47.0, 11.0, { role: 'end' });
    expect(withPointAppended([A, B, C], NEW).map((p) => p.id)).toEqual(['a', 'b', 'c', 'new']);
    expect(withPointAppended([A, B, C], NEW)[3]).toMatchObject({ role: 'end' });
    expect(withPointAppended([A, B, back], NEW).map((p) => p.id)).toEqual(['a', 'b', 'new', 'back']);
    expect(withPointAppended([A, B, back], NEW)[2]).toMatchObject({ role: 'via' });
  });

  it('TOUR-POI-INSERT-012: never suggests a shaping point, and reads how far along the route a place lies', () => {
    const shaping = point('s', 47.01, 11.0, { shaping: true });
    expect(defaultAfterId([A, shaping, C], null, 1600)).toBe('a');
    const along = alongRouteM([A, B, C], null, { lat: 47.015, lng: 11.0 });
    expect(along).toBeGreaterThan(1600);
    expect(along).toBeLessThan(1700);
  });
});
