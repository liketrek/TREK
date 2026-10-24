import { BOOK_EDGES } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { SHAPE_PATHS, scalePath } from '../../../src/components/Studio/shapes';
import { edgedPath, flattenPath, outlineRuns } from '../../../src/components/Studio/shapes-edges';

/**
 * Cut edges (shapes-edges.ts): the outline flattened, split at its corners,
 * a whole number of teeth per side, cut inwards only.
 */

const RECT = 'M0 0L60 0L60 40L0 40Z';
const points = (d: string) => {
  const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  return out;
};

describe('the outline', () => {
  it('FE-STUDIO-EDGE-001: flattens lines and curves, dropping the closing repeat', () => {
    expect(flattenPath(RECT)).toEqual([
      [0, 0],
      [60, 0],
      [60, 40],
      [0, 40],
    ]);
    const circle = flattenPath(scalePath(SHAPE_PATHS.ellipse, 50, 50));
    expect(circle.length).toBeGreaterThan(30);
    for (const [x, y] of circle) expect(Math.hypot(x - 25, y - 25)).toBeCloseTo(25, 0);
    expect(flattenPath('M0 0Q10 10 20 0Z').length).toBeGreaterThan(3);
  });

  it('FE-STUDIO-EDGE-002: splits a rectangle into four runs at its corners and a circle into one', () => {
    expect(outlineRuns(flattenPath(RECT))).toHaveLength(4);
    expect(outlineRuns(flattenPath(scalePath(SHAPE_PATHS.ellipse, 50, 50)))).toHaveLength(1);
    expect(outlineRuns(flattenPath(scalePath(SHAPE_PATHS.hexagon, 50, 50)))).toHaveLength(6);
  });
});

describe('the cut', () => {
  it('FE-STUDIO-EDGE-003: leaves a straight edge and a degenerate outline as they are', () => {
    expect(edgedPath(RECT, 'straight', 3)).toBe(RECT);
    expect(edgedPath(RECT, 'zigzag', 0)).toBe(RECT);
    expect(edgedPath('M0 0L10 0Z', 'zigzag', 3)).toBe('M0 0L10 0Z');
  });

  it('FE-STUDIO-EDGE-004: cuts every edge inwards, inside the frame, with the corners left on the outline', () => {
    for (const edge of BOOK_EDGES.filter((e) => e !== 'straight')) {
      const d = edgedPath(RECT, edge, 3, 5);
      expect(d, edge).toMatch(/^M[\d.]+ [\d.]+(L[\d.]+ [\d.]+)+Z$/);
      const pts = points(d);
      for (const [x, y] of pts) {
        expect(x, edge).toBeGreaterThanOrEqual(-0.01);
        expect(x, edge).toBeLessThanOrEqual(60.01);
        expect(y, edge).toBeGreaterThanOrEqual(-0.01);
        expect(y, edge).toBeLessThanOrEqual(40.01);
      }
      for (const corner of [
        [0, 0],
        [60, 0],
        [60, 40],
        [0, 40],
      ]) {
        expect(
          pts.some(([x, y]) => Math.hypot(x - corner[0], y - corner[1]) < 0.02),
          `${edge} ${corner}`
        ).toBe(true);
      }
    }
  });

  it('FE-STUDIO-EDGE-005: gives each side a whole number of teeth, so a stamp has round holes all round', () => {
    const zig = points(edgedPath(RECT, 'zigzag', 3));
    // 20 teeth along 60 mm and 13 along 40 mm, two points each.
    expect(zig).toHaveLength((20 + 13) * 2 * 2);
    // How deep the top side bites, its corners left out.
    const top = (pts: [number, number][]) =>
      Math.max(...pts.filter(([x, y]) => x > 3 && x < 57 && y < 10).map(([, y]) => y));
    expect(top(zig)).toBeCloseTo(1.5, 1);
    expect(top(points(edgedPath(RECT, 'perforated', 4)))).toBeCloseTo(1.2, 1);
  });

  it('FE-STUDIO-EDGE-006: tears the same way for the same seed and another way for another', () => {
    expect(edgedPath(RECT, 'torn', 3, 7)).toBe(edgedPath(RECT, 'torn', 3, 7));
    expect(edgedPath(RECT, 'torn', 3, 7)).not.toBe(edgedPath(RECT, 'torn', 3, 8));
    expect(edgedPath(RECT, 'deckle', 3, 7)).not.toBe(edgedPath(RECT, 'deckle', 3, 8));
  });

  it('FE-STUDIO-EDGE-007: coarsens the teeth past the point cap rather than drawing a path nobody can render', () => {
    const huge = 'M0 0L5000 0L5000 5000L0 5000Z';
    expect(points(edgedPath(huge, 'scallop', 0.5)).length).toBeLessThanOrEqual(3100);
  });

  it('FE-STUDIO-EDGE-008: cuts inwards whichever way the outline is wound', () => {
    const reversed = edgedPath('M0 0L0 40L60 40L60 0Z', 'zigzag', 3);
    for (const [x, y] of points(reversed)) {
      expect(x).toBeGreaterThanOrEqual(-0.01);
      expect(y).toBeLessThanOrEqual(40.01);
    }
  });
});
