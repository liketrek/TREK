import { bookTextCurvePath } from './book-text-curve';

import { describe, expect, it } from 'vitest';

/** The line a curved text runs along, in the millimetres of its frame. */

describe('the path of a curved text', () => {
  it('BKCRV-001: runs a flat arc as a straight line across the frame, inset by half an em', () => {
    const p = bookTextCurvePath({ type: 'arc', bend: 0, start: 0 }, 100, 40, 10);
    expect(p.d).toBe('M 5 23.5 L 95 23.5');
    expect(p.length).toBe(90);
  });

  it('BKCRV-002: arches clockwise over the top for a positive bend and dips anticlockwise for a negative one', () => {
    const up = bookTextCurvePath({ type: 'arc', bend: 50, start: 0 }, 100, 60, 10);
    const down = bookTextCurvePath({ type: 'arc', bend: -50, start: 0 }, 100, 60, 10);
    expect(up.d).toMatch(/ 0 0 1 95 /);
    expect(down.d).toMatch(/ 0 0 0 95 /);
    // Longer than the chord, the same either way.
    expect(up.length).toBeGreaterThan(90);
    expect(up.length).toBeCloseTo(down.length, 6);
  });

  it('BKCRV-003: bends a half circle at 100, whose length is half the circumference of the chord', () => {
    const p = bookTextCurvePath({ type: 'arc', bend: 100, start: 0 }, 120, 80, 10);
    expect(p.length).toBeCloseTo((Math.PI * 110) / 2, 4);
  });

  it('BKCRV-004: keeps a bend past the bounds to a half circle', () => {
    const half = bookTextCurvePath({ type: 'arc', bend: 100, start: 0 }, 120, 80, 10);
    expect(bookTextCurvePath({ type: 'arc', bend: 300, start: 0 }, 120, 80, 10)).toEqual(half);
  });

  it('BKCRV-005: runs a circle round the inscribed circle, brought in by the letters, starting half a turn before its centre', () => {
    const p = bookTextCurvePath({ type: 'circle', bend: 0, start: 0 }, 100, 100, 8);
    const r = 50 - 8 * 0.75;
    expect(p.length).toBeCloseTo(2 * Math.PI * r, 6);
    // From the bottom of the circle, so the middle of the words lands at the top.
    expect(p.d.startsWith(`M 50 ${50 + r}`)).toBe(true);
    expect(p.d.match(/ A /g)).toHaveLength(2);
  });

  it('BKCRV-006: never draws a circle smaller than a millimetre, whatever the letters', () => {
    expect(bookTextCurvePath({ type: 'circle', bend: 0, start: 90 }, 4, 4, 30).length).toBeCloseTo(2 * Math.PI, 6);
  });
});
