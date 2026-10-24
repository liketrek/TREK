// FE-TOUR-APPLIED-WAY-HINT-001 to FE-TOUR-APPLIED-WAY-HINT-004: the "way taken" note over the map
// and its undo, which only ever means the way (RTE-02).
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPLIED_HINT_MS, useAppliedWayHint } from './useAppliedWayHint';

const BEFORE = [{ id: 'a' }, { id: 'b' }];
const AFTER = [{ id: 'a' }, { id: 's' }, { id: 'b' }];

function setup(undo = vi.fn()) {
  const view = renderHook(({ points }: { points: readonly unknown[] }) => useAppliedWayHint(points, undo), {
    initialProps: { points: BEFORE as readonly unknown[] },
  });
  return { view, undo };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useAppliedWayHint', () => {
  it('FE-TOUR-APPLIED-WAY-HINT-001: shows once the way is written, and its undo takes exactly that back', () => {
    const { view, undo } = setup();
    expect(view.result.current.view.shown).toBe(false);
    act(() => view.result.current.note(BEFORE));
    // Noted, but nothing written yet: nothing to take back.
    expect(view.result.current.view.shown).toBe(false);
    view.rerender({ points: AFTER });
    expect(view.result.current.view.shown).toBe(true);
    expect(view.result.current.view.key).toBe(1);

    act(() => view.result.current.view.undo());
    expect(undo).toHaveBeenCalledTimes(1);
    expect(view.result.current.view.shown).toBe(false);
    // Gone, it takes nothing back a second time.
    act(() => view.result.current.view.undo());
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-APPLIED-WAY-HINT-002: goes as soon as anything else changes the points', () => {
    const { view } = setup();
    act(() => view.result.current.note(BEFORE));
    view.rerender({ points: AFTER });
    view.rerender({ points: [...AFTER, { id: 'c' }] });
    expect(view.result.current.view.shown).toBe(false);
  });

  it('FE-TOUR-APPLIED-WAY-HINT-003: goes by itself after a while, unless the pointer rests on it', () => {
    vi.useFakeTimers();
    const { view } = setup();
    act(() => view.result.current.note(BEFORE));
    view.rerender({ points: AFTER });
    act(() => view.result.current.view.hold(true));
    act(() => {
      vi.advanceTimersByTime(APPLIED_HINT_MS * 2);
    });
    expect(view.result.current.view.shown).toBe(true);
    act(() => view.result.current.view.hold(false));
    act(() => {
      vi.advanceTimersByTime(APPLIED_HINT_MS);
    });
    expect(view.result.current.view.shown).toBe(false);
  });

  it('FE-TOUR-APPLIED-WAY-HINT-004: a second way taken gets a note of its own', () => {
    const { view } = setup();
    act(() => view.result.current.note(BEFORE));
    view.rerender({ points: AFTER });
    const later = [...AFTER, { id: 't' }];
    act(() => view.result.current.note(AFTER));
    view.rerender({ points: later });
    expect(view.result.current.view).toMatchObject({ shown: true, key: 2 });
  });
});
