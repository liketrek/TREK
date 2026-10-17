// FE-COMP-TOASTQUEUE-001 to -006: the toast queue both toast presenters share.
import { act, renderHook } from '@testing-library/react';

import { useToastQueue } from './useToastQueue';

beforeEach(() => {
  vi.useFakeTimers();
  delete window.__addToast;
});
afterEach(() => {
  vi.useRealTimers();
  delete window.__addToast;
});

describe('useToastQueue', () => {
  it('FE-COMP-TOASTQUEUE-001: registers the bus and queues a toast with the default type and duration', () => {
    const { result } = renderHook(() => useToastQueue({ exitMs: 400, restorePrevious: false }));
    let id = 0;
    act(() => {
      id = window.__addToast!('Saved');
    });
    expect(id).toBeGreaterThan(0);
    expect(result.current.toasts).toEqual([{ id, message: 'Saved', type: 'info', duration: 3000, removing: false }]);
  });

  it('FE-COMP-TOASTQUEUE-002: auto-dismisses after the duration, then drops the toast after the exit time', () => {
    const { result } = renderHook(() => useToastQueue({ exitMs: 220, restorePrevious: true }));
    act(() => {
      window.__addToast!('Done', 'success', 1000);
    });
    act(() => vi.advanceTimersByTime(999));
    expect(result.current.toasts[0].removing).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.toasts[0].removing).toBe(true);
    act(() => vi.advanceTimersByTime(219));
    expect(result.current.toasts).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.toasts).toEqual([]);
  });

  it('FE-COMP-TOASTQUEUE-003: a duration of zero keeps the toast until it is dismissed', () => {
    const { result } = renderHook(() => useToastQueue({ exitMs: 400, restorePrevious: false }));
    act(() => {
      window.__addToast!('Sticky', 'warning', 0);
    });
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].removing).toBe(false);

    act(() => result.current.dismissToast(result.current.toasts[0].id));
    expect(result.current.toasts[0].removing).toBe(true);
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.toasts).toEqual([]);
  });

  it('FE-COMP-TOASTQUEUE-004: the desktop mode deletes the bus on unmount', () => {
    const previous = vi.fn(() => 1);
    window.__addToast = previous;
    const { unmount } = renderHook(() => useToastQueue({ exitMs: 400, restorePrevious: false }));
    expect(window.__addToast).not.toBe(previous);
    unmount();
    expect(window.__addToast).toBeUndefined();
  });

  it('FE-COMP-TOASTQUEUE-005: the phone mode hands the bus back to the previous holder on unmount', () => {
    const previous = vi.fn(() => 1);
    window.__addToast = previous;
    const { unmount } = renderHook(() => useToastQueue({ exitMs: 220, restorePrevious: true }));
    expect(window.__addToast).not.toBe(previous);
    unmount();
    expect(window.__addToast).toBe(previous);
  });

  it('FE-COMP-TOASTQUEUE-006: pending timers are cleared on unmount', () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useToastQueue({ exitMs: 400, restorePrevious: false }));
    act(() => {
      window.__addToast!('One', 'info', 1000);
      window.__addToast!('Two', 'error', 2000);
    });
    const before = clear.mock.calls.length;
    unmount();
    expect(clear.mock.calls.length - before).toBe(2);
    clear.mockRestore();
  });
});
