// FE-TERRAIN-FIT-001 to FE-TERRAIN-FIT-002: the 3D map's bottom row steps down to fit between the panels.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type ControlRowFit, useControlRowFit } from './useControlRowFit';

/** What the row's content needs at each step, in pixels. */
const NEEDS: Record<ControlRowFit, number> = { full: 700, compact: 480, stacked: 400 };

function fakeRow(room: { width: number }, fit: () => ControlRowFit): HTMLDivElement {
  const row = document.createElement('div');
  Object.defineProperty(row, 'clientWidth', { get: () => room.width });
  Object.defineProperty(row, 'scrollWidth', { get: () => Math.max(room.width, NEEDS[fit()]) });
  return row;
}

describe('useControlRowFit', () => {
  it('FE-TERRAIN-FIT-001: keeps every label while the row fits, and steps down only as far as it must', () => {
    const room = { width: 800 };
    const { result, rerender } = renderHook(() => useControlRowFit());
    const row = fakeRow(room, () => result.current.fit);
    act(() => result.current.attachRow(row));
    expect(result.current.fit).toBe('full');

    room.width = 500;
    rerender();
    expect(result.current.fit).toBe('compact');

    room.width = 450;
    rerender();
    expect(result.current.fit).toBe('stacked');
  });

  it('FE-TERRAIN-FIT-002: steps back up only once the room holds what the larger step needed', () => {
    const room = { width: 450 };
    const { result, rerender } = renderHook(() => useControlRowFit());
    const row = fakeRow(room, () => result.current.fit);
    act(() => result.current.attachRow(row));
    rerender();
    expect(result.current.fit).toBe('stacked');

    room.width = 600;
    rerender();
    expect(result.current.fit).toBe('compact');
    room.width = 699;
    rerender();
    expect(result.current.fit).toBe('compact');
    room.width = 700;
    rerender();
    expect(result.current.fit).toBe('full');
  });
});
