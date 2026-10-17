// FE-HOOK-TOURPLACING-001 to FE-HOOK-TOURPLACING-004: the tour map's "set points" tool and its click gate.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialTourPlaceToolState, useTourPlaceToolStore } from '../../store/tourPlaceToolStore';
import { useTourMapPlacing, type TourMapMode } from './useTourMapPlacing';

function pointer(type: string, x: number, y: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } });
  return event;
}

beforeEach(() => {
  window.sessionStorage.clear();
  useTourPlaceToolStore.setState(initialTourPlaceToolState());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useTourMapPlacing', () => {
  it('FE-HOOK-TOURPLACING-001: on in 2D and off in 3D to begin with', () => {
    const { result, rerender } = renderHook(({ mode }: { mode: TourMapMode }) => useTourMapPlacing(mode), {
      initialProps: { mode: '2d' },
    });
    expect(result.current.active).toBe(true);
    rerender({ mode: '3d' });
    expect(result.current.active).toBe(false);
  });

  it('FE-HOOK-TOURPLACING-002: each mode keeps its own choice, for the rest of the session', () => {
    const { result, rerender, unmount } = renderHook(({ mode }: { mode: TourMapMode }) => useTourMapPlacing(mode), {
      initialProps: { mode: '3d' },
    });
    act(() => result.current.toggle());
    expect(result.current.active).toBe(true);
    rerender({ mode: '2d' });
    act(() => result.current.toggle());
    expect(result.current.active).toBe(false);
    unmount();

    const again = renderHook(({ mode }: { mode: TourMapMode }) => useTourMapPlacing(mode), {
      initialProps: { mode: '3d' },
    });
    expect(again.result.current.active).toBe(true);
    again.rerender({ mode: '2d' });
    expect(again.result.current.active).toBe(false);
  });

  it('FE-HOOK-TOURPLACING-003: the gate lets a click through and drops the end of a drag', () => {
    const el = document.createElement('div');
    let clock = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    const { result } = renderHook(() => useTourMapPlacing('2d'));
    act(() => result.current.attach(el));
    const handler = vi.fn();
    const gated = result.current.gate(handler);

    el.dispatchEvent(pointer('pointerdown', 10, 10));
    clock = 90;
    el.dispatchEvent(pointer('pointerup', 11, 10));
    gated?.(1, 2);
    expect(handler).toHaveBeenCalledWith(1, 2);

    el.dispatchEvent(pointer('pointerdown', 10, 10));
    el.dispatchEvent(pointer('pointermove', 30, 10));
    clock = 150;
    el.dispatchEvent(pointer('pointerup', 30, 10));
    gated?.(3, 4);
    expect(handler).toHaveBeenCalledTimes(1);

    // A hold that never moved, longer than a click.
    clock = 1000;
    el.dispatchEvent(pointer('pointerdown', 10, 10));
    clock = 1600;
    el.dispatchEvent(pointer('pointerup', 10, 10));
    gated?.(5, 6);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-TOURPLACING-004: no handler, no gate; without storage the choice holds while the stage is up', () => {
    const { result } = renderHook(() => useTourMapPlacing('2d'));
    expect(result.current.gate(undefined)).toBeUndefined();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const blocked = renderHook(({ mode }: { mode: TourMapMode }) => useTourMapPlacing(mode), {
      initialProps: { mode: '3d' },
    });
    expect(blocked.result.current.active).toBe(false);
    act(() => blocked.result.current.toggle());
    blocked.rerender({ mode: '2d' });
    blocked.rerender({ mode: '3d' });
    expect(blocked.result.current.active).toBe(true);
  });
});
