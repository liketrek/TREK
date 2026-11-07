import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetOverlayStack, closeTopOverlay, hasOpenOverlay, useHasOpenOverlay, useOverlay } from './overlayStack';

beforeEach(() => _resetOverlayStack());

describe('overlayStack', () => {
  it('closes the newest open overlay first, and reports when none is left', () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = renderHook(({ open }) => useOverlay(open, first), { initialProps: { open: true } });
    renderHook(({ open }) => useOverlay(open, second), { initialProps: { open: true } });
    expect(hasOpenOverlay()).toBe(true);

    expect(closeTopOverlay()).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    a.rerender({ open: false });
    a.unmount();
  });

  it('forgets an overlay once it closes, and uses its latest close path', () => {
    const old = vi.fn();
    const fresh = vi.fn();
    const h = renderHook(({ open, close }) => useOverlay(open, close), { initialProps: { open: true, close: old } });
    h.rerender({ open: true, close: fresh });
    closeTopOverlay();
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(old).not.toHaveBeenCalled();

    h.rerender({ open: false, close: fresh });
    expect(hasOpenOverlay()).toBe(false);
    expect(closeTopOverlay()).toBe(false);
  });

  it('tells a component when an overlay opens and when the last one closes', () => {
    const watch = renderHook(() => useHasOpenOverlay());
    expect(watch.result.current).toBe(false);
    const sheet = renderHook(({ open }) => useOverlay(open, () => {}), { initialProps: { open: true } });
    expect(watch.result.current).toBe(true);
    sheet.rerender({ open: false });
    expect(watch.result.current).toBe(false);
  });
});
