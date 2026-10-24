// FE-ROUTE-LEG-AT-001 to FE-ROUTE-LEG-AT-005: which leg a click on the drawn route lands in (P2A-03),
// and the stretch of the route a leg spans (RTE-02).
import { describe, expect, it } from 'vitest';
import { legSpanOf, legStartAt } from './routeLegAt';

const A = { id: 'a', lat: 49.0, lng: 12.0 };
const B = { id: 'b', lat: 49.0, lng: 12.1 };
const C = { id: 'c', lat: 49.1, lng: 12.1 };
// The route bends between the points, as a river does.
const LINE: [number, number][] = [
  [49.0, 12.0],
  [49.01, 12.05],
  [49.0, 12.1],
  [49.05, 12.11],
  [49.1, 12.1],
];

describe('legStartAt', () => {
  it('FE-ROUTE-LEG-AT-001: a spot on the line belongs to the leg whose two points enclose it', () => {
    expect(legStartAt([A, B, C], LINE, 49.009, 12.05)).toBe('a');
    expect(legStartAt([A, B, C], LINE, 49.05, 12.11)).toBe('b');
  });

  it('FE-ROUTE-LEG-AT-002: a loop keeps its order, so a spot near the start on the way back is the last leg', () => {
    const back = { id: 'back', lat: A.lat, lng: A.lng };
    const loop: [number, number][] = [...LINE, [49.05, 12.02], [49.0, 12.0]];
    expect(legStartAt([A, B, C, back], loop, 49.05, 12.02)).toBe('c');
  });

  it('FE-ROUTE-LEG-AT-003: without a line or a leg there is nothing to shape', () => {
    expect(legStartAt([A, B], null, 49, 12.05)).toBeNull();
    expect(legStartAt([A], LINE, 49, 12.05)).toBeNull();
    expect(legStartAt([A, B], [[49, 12]], 49, 12.05)).toBeNull();
  });
});

describe('legSpanOf', () => {
  it('FE-ROUTE-LEG-AT-004: a leg spans the vertices from where its point lies to where the next one does', () => {
    expect(legSpanOf([A, B, C], LINE, 0)).toEqual({ from: 0, to: 2 });
    expect(legSpanOf([A, B, C], LINE, 1)).toEqual({ from: 2, to: 4 });
    // The way back of a loop ends on the line's end, not on the start it shares a spot with.
    const back = { lat: A.lat, lng: A.lng };
    const loop: [number, number][] = [...LINE, [49.05, 12.02], [49.0, 12.0]];
    expect(legSpanOf([A, B, C, back], loop, 2)).toEqual({ from: 4, to: 6 });
  });

  it('FE-ROUTE-LEG-AT-005: no span without a line, past the last point, or for two points on one spot', () => {
    expect(legSpanOf([A, B], null, 0)).toBeNull();
    expect(legSpanOf([A, B], LINE, 1)).toBeNull();
    expect(legSpanOf([A, B], LINE, -1)).toBeNull();
    expect(legSpanOf([A, A], LINE, 0)).toBeNull();
  });
});
