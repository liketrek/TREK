// FE-LOGIN-DOTS-001 to FE-LOGIN-DOTS-006
import { describe, it, expect } from 'vitest';
import { WORLD_GRID_H, WORLD_GRID_W, WORLD_LAT_BOT, WORLD_LAT_TOP, worldDots } from './worldDots';

describe('worldDots', () => {
  it('FE-LOGIN-DOTS-001: exposes the grid the packed coastlines were baked against', () => {
    expect(WORLD_GRID_W).toBe(300);
    expect(WORLD_GRID_H).toBe(150);
    expect(WORLD_LAT_TOP).toBe(80);
    expect(WORLD_LAT_BOT).toBe(-58);
  });

  it('FE-LOGIN-DOTS-002: reads the first token as an absolute base36 cell index', () => {
    const dots = worldDots();
    // '1u' base36 = 66, and the next two tokens are +1 each.
    expect(dots[0]).toEqual({ x: 66, y: 0 });
    expect(dots[1]).toEqual({ x: 67, y: 0 });
    expect(dots[2]).toEqual({ x: 68, y: 0 });
  });

  it('FE-LOGIN-DOTS-003: decodes one dot per packed token', () => {
    expect(worldDots()).toHaveLength(7131);
  });

  it('FE-LOGIN-DOTS-004: keeps every dot inside the grid', () => {
    const dots = worldDots();
    for (const d of dots) {
      expect(Number.isInteger(d.x)).toBe(true);
      expect(Number.isInteger(d.y)).toBe(true);
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThan(WORLD_GRID_W);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThan(WORLD_GRID_H);
    }
  });

  it('FE-LOGIN-DOTS-005: yields strictly increasing cell indices, so the deltas never fold back', () => {
    const dots = worldDots();
    let previous = -1;
    for (const d of dots) {
      const index = d.y * WORLD_GRID_W + d.x;
      expect(index).toBeGreaterThan(previous);
      previous = index;
    }
    // Last cell of the bundle — the southern tip of South America.
    expect(dots[dots.length - 1]).toEqual({ x: 128, y: 149 });
  });

  it('FE-LOGIN-DOTS-006: returns an independent array on every call', () => {
    const first = worldDots();
    const second = worldDots();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    first.length = 0;
    expect(second.length).toBe(7131);
  });
});
