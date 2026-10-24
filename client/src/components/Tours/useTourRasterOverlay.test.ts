import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBaseMapHealth, useTileHealth, useTourRasterOverlay } from './useTourRasterOverlay';

const SEAMARKS = { id: 'seamarks', url: 'https://x/{z}/{x}/{y}.png', attribution: 'x', minZoom: 6, maxZoom: 18 };

describe('useBaseMapHealth (MAP-01, BIK-06)', () => {
  it('watches a map on terms only, names it, and asks afresh when another becomes the base map', () => {
    const { result, rerender } = renderHook((layer: string) => useBaseMapHealth(layer), { initialProps: 'topo' });
    expect(result.current).toBeUndefined();
    rerender('cycle');
    expect(result.current).toMatchObject({ base: 'cycle', down: false });
    act(() => {
      for (let i = 0; i < 4; i += 1) result.current?.onTileError();
    });
    expect(result.current?.down).toBe(true);
    rerender('hiking');
    expect(result.current).toMatchObject({ base: 'hiking', down: false });
  });
});

describe('useTileHealth', () => {
  it('counts a source down after a run of failures, never after a stray one, and up again on one tile', () => {
    const { result } = renderHook(() => useTileHealth());
    act(() => result.current.onTileError());
    expect(result.current.down).toBe(false);
    act(() => {
      result.current.onTileError();
      result.current.onTileError();
      result.current.onTileError();
    });
    expect(result.current.down).toBe(true);
    act(() => result.current.onTileLoad());
    expect(result.current.down).toBe(false);
  });

  it('starts afresh on reset', () => {
    const { result } = renderHook(() => useTileHealth());
    act(() => {
      for (let i = 0; i < 4; i++) result.current.onTileError();
    });
    act(() => result.current.reset());
    expect(result.current.down).toBe(false);
    act(() => result.current.onTileError());
    expect(result.current.down).toBe(false);
  });
});

describe('useTourRasterOverlay', () => {
  it('is off unless offered and on, and down after a run of failures until switched again', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(
      ({ offered, active }) => useTourRasterOverlay(SEAMARKS, offered, active, toggle),
      {
        initialProps: { offered: false, active: true },
      }
    );
    expect(result.current.status).toBe('off');
    rerender({ offered: true, active: true });
    expect(result.current.status).toBe('on');
    act(() => {
      for (let i = 0; i < 4; i++) result.current.onTileError();
    });
    expect(result.current.status).toBe('down');
    act(() => result.current.onToggle());
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('on');
  });

  it('tries afresh each time it comes on without its switch, as the pistes of a ski tour do', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ active }) => useTourRasterOverlay(SEAMARKS, true, active, toggle), {
      initialProps: { active: true },
    });
    act(() => {
      for (let i = 0; i < 4; i++) result.current.onTileError();
    });
    expect(result.current.status).toBe('down');
    // The tour closes, a later one shows the overlay by default: it opens on, not down.
    rerender({ active: false });
    expect(result.current.status).toBe('off');
    rerender({ active: true });
    expect(result.current.status).toBe('on');
    expect(toggle).not.toHaveBeenCalled();
  });

  it('marks an overlay that is on while the map is further out than its first tiles, and nothing at an unknown zoom', () => {
    const { result, rerender } = renderHook(
      ({ active, zoom }: { active: boolean; zoom: number | null }) =>
        useTourRasterOverlay(SEAMARKS, true, active, vi.fn(), zoom),
      { initialProps: { active: true, zoom: null as number | null } }
    );
    expect(result.current.belowMinZoom).toBe(false);
    rerender({ active: true, zoom: SEAMARKS.minZoom - 0.5 });
    expect(result.current).toMatchObject({ status: 'on', belowMinZoom: true });
    rerender({ active: true, zoom: SEAMARKS.minZoom });
    expect(result.current.belowMinZoom).toBe(false);
    // Off, there is nothing to zoom in for.
    rerender({ active: false, zoom: 2 });
    expect(result.current).toMatchObject({ status: 'off', belowMinZoom: false });
  });
});
