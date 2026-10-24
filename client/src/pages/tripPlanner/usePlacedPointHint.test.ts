// FE-HOOK-PLACEDHINT-001 to FE-HOOK-PLACEDHINT-006: "point set" after a click on the map, and its undo.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLACED_HINT_MS, usePlacedPointHint } from './usePlacedPointHint';

interface Props {
  waypoints: readonly unknown[];
  difficulty: unknown;
  enabled: boolean;
}

const A = { id: 'a' };
const B = { id: 'b' };

function setup(initial: Partial<Props> = {}) {
  const undo = vi.fn();
  const view = renderHook((props: Props) => usePlacedPointHint({ ...props, undo }), {
    initialProps: { waypoints: [A], difficulty: 'T2', enabled: true, ...initial },
  });
  /** Notes the click and lands the add in the same update, the way the map does. */
  const place = (after: readonly unknown[], rest: Partial<Props> = {}) => {
    act(() => view.result.current.notePlacement());
    view.rerender({ waypoints: after, difficulty: 'T2', enabled: true, ...rest });
  };
  return { ...view, undo, place };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePlacedPointHint', () => {
  it('FE-HOOK-PLACEDHINT-001: shows once the point is in, and its undo takes back exactly that add', () => {
    const { result, undo, place } = setup();
    expect(result.current.shown).toBe(false);
    place([A, B]);
    expect(result.current.shown).toBe(true);
    act(() => result.current.undoPlacement());
    expect(undo).toHaveBeenCalledTimes(1);
    expect(result.current.shown).toBe(false);
  });

  it('FE-HOOK-PLACEDHINT-002: goes by itself after a few seconds, but not while the pointer rests on it', () => {
    const { result, place } = setup();
    place([A, B]);
    act(() => result.current.hold(true));
    act(() => {
      vi.advanceTimersByTime(PLACED_HINT_MS * 2);
    });
    expect(result.current.shown).toBe(true);
    act(() => result.current.hold(false));
    act(() => {
      vi.advanceTimersByTime(PLACED_HINT_MS - 1);
    });
    expect(result.current.shown).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.shown).toBe(false);
  });

  it('FE-HOOK-PLACEDHINT-003: any later change to the points ends it, so undo never reverts something else', () => {
    const { result, rerender, undo, place } = setup();
    place([A, B]);
    rerender({ waypoints: [A, { id: 'b', moved: true }], difficulty: 'T2', enabled: true });
    expect(result.current.shown).toBe(false);
    act(() => result.current.undoPlacement());
    expect(undo).not.toHaveBeenCalled();
  });

  it('FE-HOOK-PLACEDHINT-004: so does a new difficulty, which is in the same undo history', () => {
    const { result, rerender, place } = setup();
    const after = [A, B];
    place(after);
    rerender({ waypoints: after, difficulty: 'T4', enabled: true });
    expect(result.current.shown).toBe(false);
  });

  it('FE-HOOK-PLACEDHINT-005: a refused add shows nothing, not even at the next change', () => {
    const { result, rerender } = setup();
    act(() => result.current.notePlacement());
    rerender({ waypoints: [A], difficulty: 'T2', enabled: true });
    expect(result.current.shown).toBe(false);
    rerender({ waypoints: [{ id: 'a', moved: true }], difficulty: 'T2', enabled: true });
    expect(result.current.shown).toBe(false);
  });

  it('FE-HOOK-PLACEDHINT-006: stays hidden while it must give way, and shows again after', () => {
    const { result, rerender, place } = setup();
    const after = [A, B];
    place(after);
    rerender({ waypoints: after, difficulty: 'T2', enabled: false });
    expect(result.current.shown).toBe(false);
    rerender({ waypoints: after, difficulty: 'T2', enabled: true });
    expect(result.current.shown).toBe(true);
  });
});
