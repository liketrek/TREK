import { bookLineCapSize, bookLineElementSchema, type BookLineElement } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { lineDash, lineGeometry } from '../../../src/components/Studio/lineRender';

/**
 * A line as geometry (lineRender.ts): the body, its heads and its ornament,
 * all as paths in the frame's millimetres.
 */

const line = (over: Partial<BookLineElement> = {}) =>
  bookLineElementSchema.parse({ id: 'l1', kind: 'line', frame: { x: 0, y: 0, w: 100, h: 10 }, ...over });

const nums = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
const xs = (d: string) => nums(d).filter((_, i) => i % 2 === 0);
const ys = (d: string) => nums(d).filter((_, i) => i % 2 === 1);

describe('the body', () => {
  it('FE-STUDIO-LINE-001: is one straight stroke from end to end for a plain line, butt ended', () => {
    const g = lineGeometry(line(), 100, 10);
    expect(g.body).toEqual(['M0 5L100 5']);
    expect([g.fills, g.strokes, g.dash, g.cap]).toEqual([[], [], undefined, 'butt']);
  });

  it('FE-STUDIO-LINE-002: stops short of a filled head, so a thick line does not poke through its point', () => {
    const g = lineGeometry(line({ endCap: 'arrow', strokeWidth: 1 }), 100, 10);
    const size = bookLineCapSize(1);
    expect(Math.max(...xs(g.body[0]))).toBeCloseTo(100 - size * 0.7, 1);
    expect(g.fills).toHaveLength(1);
    expect(Math.max(...xs(g.fills[0]))).toBeCloseTo(100, 1);
    const open = lineGeometry(line({ startCap: 'open', endCap: 'bar' }), 100, 10);
    expect(open.strokes).toHaveLength(2);
    expect(Math.min(...xs(open.body[0]))).toBeCloseTo(0.25, 2);
    const dot = lineGeometry(line({ startCap: 'dot' }), 100, 10);
    expect(dot.fills[0]).toMatch(/^M0 4.2C/);
  });

  it('FE-STUDIO-LINE-003: opens in the middle for an ornament and sets it there', () => {
    for (const ornament of ['diamond', 'dot', 'star', 'sun', 'heart'] as const) {
      const g = lineGeometry(line({ ornament, strokeWidth: 0.3 }), 100, 10);
      expect(g.body, ornament).toHaveLength(2);
      expect(g.fills, ornament).toHaveLength(1);
      const mid = xs(g.fills[0]);
      expect((Math.min(...mid) + Math.max(...mid)) / 2, ornament).toBeCloseTo(50, 0);
      expect(Math.max(...xs(g.body[0]))).toBeLessThan(Math.min(...mid));
    }
  });

  it('FE-STUDIO-LINE-004: lays a wave or a zigzag along it, calm at the ends', () => {
    const wave = lineGeometry(line({ squiggle: 'wave' }), 100, 10);
    const wy = ys(wave.body[0]);
    expect(Math.max(...wy) - Math.min(...wy)).toBeGreaterThan(1.5);
    expect(wy[0]).toBeCloseTo(5, 2);
    expect(wy[wy.length - 1]).toBeCloseTo(5, 2);
    const zig = lineGeometry(line({ squiggle: 'zigzag' }), 100, 10);
    expect(new Set(ys(zig.body[0]).map((v) => Math.round(v * 10) / 10))).toEqual(new Set([3.9, 5, 6.1]));
  });

  it('FE-STUDIO-LINE-005: wobbles as if drawn by hand, the same way every time for one element, held at its ends', () => {
    const a = lineGeometry(line({ wobble: 1 }), 100, 10, 'l-a');
    expect(lineGeometry(line({ wobble: 1 }), 100, 10, 'l-a')).toEqual(a);
    expect(lineGeometry(line({ wobble: 1 }), 100, 10, 'l-b').body).not.toEqual(a.body);
    expect(a.cap).toBe('round');
    const y = ys(a.body[0]);
    expect(y[0]).toBeCloseTo(5, 2);
    expect(Math.max(...y.map((v) => Math.abs(v - 5)))).toBeGreaterThan(0.05);
  });

  it('FE-STUDIO-LINE-006: runs a smooth curve through more than two points', () => {
    const points = [
      { x: 0, y: 1 },
      { x: 0.5, y: 0 },
      { x: 1, y: 1 },
    ];
    const g = lineGeometry(line({ points, curve: 'smooth' }), 100, 10);
    expect(nums(g.body[0]).length).toBeGreaterThan(40);
    const straight = lineGeometry(line({ points }), 100, 10);
    expect(straight.body).toEqual(['M0 10L50 0L100 10']);
  });

  it('FE-STUDIO-LINE-007: draws nothing for a line with no length', () => {
    const g = lineGeometry(
      line({
        points: [
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: 0.5 },
        ],
        endCap: 'arrow',
      }),
      100,
      10
    );
    expect([g.body, g.fills]).toEqual([[], []]);
  });
});

describe('the dash', () => {
  it('FE-STUDIO-LINE-008: follows the width and stays visible on a hairline', () => {
    expect(lineDash('solid', 1)).toBeUndefined();
    expect(lineDash('dashed', 1)).toBe('3 2');
    expect(lineDash('dashed', 0.1)).toBe('1.2 0.9');
    expect(lineDash('dotted', 0.5)).toBe('0.01 1');
    expect(lineGeometry(line({ dash: 'dotted' }), 100, 10).cap).toBe('round');
  });
});
