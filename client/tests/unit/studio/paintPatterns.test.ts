import { BOOK_PATTERNS, type BookPattern } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  MAX_PATTERN_PRIMITIVES,
  PATTERN_CELL_MM,
  estimatePrimitives,
  fittedCell,
  mulberry32,
  patternGeometry,
  sunburstRays,
} from '../../../src/components/Studio/paint/patterns';

/**
 * The pattern generators: the twelve repeats drawn out as geometry. These are
 * what prints, so the checks are about the numbers that land in the PDF:
 * that every repeat draws, that it covers the box however it is turned, that
 * the cap holds on the largest page at the smallest scale, and that the same
 * paint always draws the same thing.
 */

const box = { x: 0, y: 0, w: 60, h: 40 };
const spread = { x: -3, y: -3, w: 426, h: 216 };
const draw = (pattern: BookPattern, over: { scale?: number; angle?: number } = {}, at = box) =>
  patternGeometry({ pattern, scale: over.scale ?? 1, angle: over.angle ?? 0 }, at);

/** Every number in a path, so its range and precision can be read. */
const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
/** Where each primitive starts: the absolute point after every M. */
const starts = (d: string) =>
  [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

describe('every repeat', () => {
  it.each(BOOK_PATTERNS.map((p) => [p]))(
    '%s draws something, within the cap, at hundredths of a millimetre',
    (pattern) => {
      const geo = draw(pattern);
      expect(geo.count).toBeGreaterThan(0);
      expect(geo.count).toBeLessThanOrEqual(MAX_PATTERN_PRIMITIVES);
      expect(geo.layers.length).toBeGreaterThan(0);
      for (const layer of geo.layers) {
        expect(layer.d.startsWith('M')).toBe(true);
        expect(layer.opacity).toBeGreaterThan(0);
        expect(layer.opacity).toBeLessThanOrEqual(1);
        for (const n of numbers(layer.d)) {
          expect(Number.isFinite(n)).toBe(true);
          expect(Math.round(n * 100) / 100).toBe(n);
        }
      }
    }
  );

  it.each(BOOK_PATTERNS.map((p) => [p]))('%s draws the same path every time', (pattern) => {
    expect(draw(pattern, { scale: 0.8, angle: 30 })).toEqual(draw(pattern, { scale: 0.8, angle: 30 }));
  });

  it.each(BOOK_PATTERNS.map((p) => [p]))(
    '%s holds the cap across a whole double spread at the smallest scale',
    (pattern) => {
      const geo = draw(pattern, { scale: 0.25, angle: 17 }, spread);
      expect(geo.count).toBeGreaterThan(0);
      expect(geo.count).toBeLessThanOrEqual(MAX_PATTERN_PRIMITIVES);
    }
  );

  it.each(BOOK_PATTERNS.map((p) => [p]))('%s draws more of itself at a smaller scale, up to the cap', (pattern) => {
    if (pattern === 'gingham' || pattern === 'stripes' || pattern === 'pinstripe' || pattern === 'grid') {
      expect(draw(pattern, { scale: 0.5 }).count).toBeGreaterThan(draw(pattern, { scale: 2 }).count);
      return;
    }
    expect(draw(pattern, { scale: 0.5 }).count).toBeGreaterThanOrEqual(draw(pattern, { scale: 2 }).count);
  });
});

describe('turning', () => {
  it('turns the drawing about the box centre and covers the box whichever way it points', () => {
    const geo = draw('stripes', { angle: 45 });
    expect(geo.transform).toBe('rotate(45 30 20)');
    const xs = starts(geo.layers[0].d).map(([x]) => x);
    // The region is the square around the box's circle: past both edges by the corner's reach.
    const reach = Math.hypot(60, 40) / 2;
    expect(Math.min(...xs)).toBeLessThanOrEqual(30 - reach);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(30 + reach - PATTERN_CELL_MM);
  });

  it('draws an unturned repeat over the box alone, with no transform', () => {
    const geo = draw('checker', { angle: 360 });
    expect(geo.transform).toBeUndefined();
    const values = numbers(geo.layers[0].d);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-PATTERN_CELL_MM);
  });

  it('turns a sunburst by its rays rather than by a transform', () => {
    const straight = draw('sunburst');
    const turned = draw('sunburst', { angle: 10 });
    expect(turned.transform).toBeUndefined();
    expect(turned.layers[0].d).not.toBe(straight.layers[0].d);
    expect(turned.count).toBe(straight.count);
  });
});

describe('the cap', () => {
  it('grows the cell instead of the page', () => {
    const cell = fittedCell('dots', 2, 426, 216);
    expect(cell).toBeGreaterThan(2);
    expect(estimatePrimitives('dots', cell, 426, 216)).toBeLessThanOrEqual(MAX_PATTERN_PRIMITIVES);
    // A small box at a fair scale keeps its own cell.
    expect(fittedCell('dots', 8, 60, 40)).toBe(8);
  });

  it('never passes a cap given lower, and reports the cell it used', () => {
    const geo = patternGeometry({ pattern: 'confetti', scale: 0.25, angle: 0 }, spread, 50);
    expect(geo.count).toBeLessThanOrEqual(50);
    expect(geo.cell).toBeGreaterThan(PATTERN_CELL_MM * 0.25);
  });

  it('counts a sunburst by its rays, between 8 and 72 of them', () => {
    expect(sunburstRays(PATTERN_CELL_MM)).toBe(24);
    expect(sunburstRays(1000)).toBe(8);
    expect(sunburstRays(0.01)).toBe(72);
    expect(estimatePrimitives('sunburst', PATTERN_CELL_MM, 10, 10)).toBe(24);
    expect(draw('sunburst').count).toBe(12);
  });
});

describe('the odd cases', () => {
  it('draws nothing for an empty box or a scale that is not a number', () => {
    expect(draw('dots', {}, { x: 0, y: 0, w: 0, h: 10 }).count).toBe(0);
    expect(patternGeometry({ pattern: 'dots', scale: Number.NaN, angle: 0 }, box).layers).toEqual([]);
    expect(patternGeometry({ pattern: 'dots', scale: -1, angle: 0 }, box).count).toBe(0);
  });

  it('draws gingham as two half-opaque layers, so where the bands cross reads darker', () => {
    const geo = draw('gingham');
    expect(geo.layers.map((l) => l.opacity)).toEqual([0.5, 0.5]);
  });

  it('scatters confetti from a seed, the same scatter for the same paint', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const seq = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seq);
    for (const v of seq) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(draw('confetti', { scale: 1 })).not.toEqual(draw('confetti', { scale: 1.5 }));
  });

  it('offsets a box that does not start at the origin', () => {
    const geo = draw('grid', {}, { x: 100, y: 50, w: 20, h: 20 });
    for (const [x, y] of starts(geo.layers[0].d)) {
      expect(x).toBeGreaterThanOrEqual(100 - PATTERN_CELL_MM);
      expect(y).toBeGreaterThanOrEqual(50 - PATTERN_CELL_MM);
      expect(x).toBeLessThan(120);
      expect(y).toBeLessThan(70);
    }
  });
});
