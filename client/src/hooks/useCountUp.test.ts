// FE-HOOK-COUNTUP-001 to FE-HOOK-COUNTUP-006
import { act, renderHook } from '@testing-library/react';

// The hook reads navigator.userAgent once at module load to detect jsdom and
// skip the animation. Every test therefore imports it fresh, with the user
// agent already faked to whatever that test needs.
async function loadHook(userAgent: string) {
  vi.resetModules();
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
  return (await import('./useCountUp')).useCountUp;
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0.0.0';
const JSDOM_UA = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 jsdom/26.0.0';

/** Drives requestAnimationFrame by hand so the easing is deterministic. */
function stubRaf(): { flush: (now: number) => void; cancelled: number[] } {
  const pending = new Map<number, FrameRequestCallback>();
  const cancelled: number[] = [];
  let id = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    pending.set(++id, cb);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((handle: number) => {
    cancelled.push(handle);
    pending.delete(handle);
  }));
  return {
    flush(now: number) {
      const due = [...pending.entries()];
      pending.clear();
      for (const [, cb] of due) cb(now);
    },
    cancelled,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, 'userAgent', { value: JSDOM_UA, configurable: true });
});

describe('useCountUp', () => {
  it('FE-HOOK-COUNTUP-001: returns the target immediately under jsdom', async () => {
    const useCountUp = await loadHook(JSDOM_UA);
    const { result } = renderHook(() => useCountUp(42));
    expect(result.current).toBe(42);
  });

  it('FE-HOOK-COUNTUP-002: animates from 0 to the target with an ease-out curve', async () => {
    const raf = stubRaf();
    const useCountUp = await loadHook(BROWSER_UA);

    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);

    // First frame establishes the start timestamp, so it still reads 0.
    act(() => raf.flush(1000));
    expect(result.current).toBe(0);

    // Half way through, ease-out-quint is already at 1 - 0.5^5 = 96.875%.
    act(() => raf.flush(1500));
    expect(result.current).toBe(97);

    act(() => raf.flush(2000));
    expect(result.current).toBe(100);
  });

  it('FE-HOOK-COUNTUP-003: stops requesting frames once it reaches the target', async () => {
    const raf = stubRaf();
    const useCountUp = await loadHook(BROWSER_UA);

    const { result } = renderHook(() => useCountUp(50, 400));
    act(() => raf.flush(0));
    act(() => raf.flush(400));
    expect(result.current).toBe(50);

    // No further frame was scheduled, so flushing again changes nothing.
    act(() => raf.flush(800));
    expect(result.current).toBe(50);
  });

  it('FE-HOOK-COUNTUP-004: cancels the pending frame on unmount', async () => {
    const raf = stubRaf();
    const useCountUp = await loadHook(BROWSER_UA);

    const { unmount } = renderHook(() => useCountUp(80, 600));
    act(() => raf.flush(0));
    unmount();
    expect(raf.cancelled.length).toBeGreaterThan(0);
  });

  it('FE-HOOK-COUNTUP-005: skips the animation when reduced motion is preferred', async () => {
    stubRaf();
    const useCountUp = await loadHook(BROWSER_UA);
    const matchMedia = vi.mocked(window.matchMedia);
    matchMedia.mockReturnValueOnce({ matches: true } as unknown as MediaQueryList);

    const { result } = renderHook(() => useCountUp(64));
    expect(result.current).toBe(64);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('FE-HOOK-COUNTUP-006: passes non-positive targets straight through', async () => {
    stubRaf();
    const useCountUp = await loadHook(BROWSER_UA);

    const { result, rerender } = renderHook(({ target }) => useCountUp(target), {
      initialProps: { target: 0 },
    });
    expect(result.current).toBe(0);

    rerender({ target: -5 });
    expect(result.current).toBe(-5);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
