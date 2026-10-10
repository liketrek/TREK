// FE-COMP-SPLASHBEATS-001 to -006: the beat cycle both trip-open splashes share.
import { act, renderHook } from '@testing-library/react';

import { SPLASH_STEPS, SPLASH_STEP_MS, SPLASH_STILL_INDEX, useTripSplashBeats } from './useTripSplashBeats';

type Listener = () => void;

function stubReducedMotion(initial: boolean) {
  const mq = {
    matches: initial,
    listeners: new Set<Listener>(),
    addEventListener: vi.fn((_: string, fn: Listener) => mq.listeners.add(fn)),
    removeEventListener: vi.fn((_: string, fn: Listener) => mq.listeners.delete(fn)),
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => mq),
  });
  return {
    mq,
    flip(next: boolean) {
      mq.matches = next;
      mq.listeners.forEach((fn) => fn());
    },
  };
}

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  else delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('useTripSplashBeats', () => {
  it('FE-COMP-SPLASHBEATS-001: holds the four beats, 1400 ms apart, parking on the third', () => {
    expect(SPLASH_STEPS.map((s) => s.scene)).toEqual(['packing', 'transport', 'dashboard', 'collections']);
    expect(SPLASH_STEP_MS).toBe(1400);
    expect(SPLASH_STILL_INDEX).toBe(2);
    expect(SPLASH_STEPS[SPLASH_STILL_INDEX].key).toBe('trip.loadingPhotos');
  });

  it.each([false, true])(
    'FE-COMP-SPLASHBEATS-002: steps through the beats and loops (liveReducedMotion %s)',
    (liveReducedMotion) => {
      stubReducedMotion(false);
      const { result } = renderHook(() => useTripSplashBeats({ liveReducedMotion }));
      expect(result.current.activeIndex).toBe(0);
      expect(result.current.step).toBe(SPLASH_STEPS[0]);
      expect(result.current.steps).toBe(SPLASH_STEPS);
      act(() => vi.advanceTimersByTime(SPLASH_STEP_MS - 1));
      expect(result.current.activeIndex).toBe(0);
      act(() => vi.advanceTimersByTime(1));
      expect(result.current.activeIndex).toBe(1);
      act(() => vi.advanceTimersByTime(SPLASH_STEP_MS * 3));
      expect(result.current.activeIndex).toBe(0);
      expect(result.current.reduceMotion).toBeFalsy();
    }
  );

  it.each([false, true])(
    'FE-COMP-SPLASHBEATS-003: under reduced motion parks on the still beat (liveReducedMotion %s)',
    (liveReducedMotion) => {
      stubReducedMotion(true);
      const { result } = renderHook(() => useTripSplashBeats({ liveReducedMotion }));
      expect(result.current.reduceMotion).toBe(true);
      expect(result.current.activeIndex).toBe(SPLASH_STILL_INDEX);
      act(() => vi.advanceTimersByTime(SPLASH_STEP_MS * 5));
      expect(result.current.activeIndex).toBe(SPLASH_STILL_INDEX);
      expect(result.current.step).toBe(SPLASH_STEPS[SPLASH_STILL_INDEX]);
    }
  );

  it('FE-COMP-SPLASHBEATS-004: live, follows the setting flipped while the splash is up and unsubscribes', () => {
    const media = stubReducedMotion(false);
    const { result, unmount } = renderHook(() => useTripSplashBeats({ liveReducedMotion: true }));
    expect(media.mq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    act(() => media.flip(true));
    expect(result.current.reduceMotion).toBe(true);
    expect(result.current.activeIndex).toBe(SPLASH_STILL_INDEX);
    act(() => vi.advanceTimersByTime(SPLASH_STEP_MS * 2));
    expect(result.current.activeIndex).toBe(SPLASH_STILL_INDEX);
    act(() => media.flip(false));
    expect(result.current.reduceMotion).toBe(false);
    unmount();
    expect(media.mq.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(media.mq.listeners.size).toBe(0);
  });

  it('FE-COMP-SPLASHBEATS-005: not live, never subscribes and picks up the setting on the next render', () => {
    const media = stubReducedMotion(false);
    const { result, rerender } = renderHook(() => useTripSplashBeats({ liveReducedMotion: false }));
    expect(media.mq.addEventListener).not.toHaveBeenCalled();
    act(() => media.flip(true));
    expect(result.current.reduceMotion).toBe(false);
    rerender();
    expect(result.current.reduceMotion).toBe(true);
    expect(result.current.activeIndex).toBe(SPLASH_STILL_INDEX);
  });

  it('FE-COMP-SPLASHBEATS-006: live without matchMedia, plays the beats', () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: undefined });
    const { result } = renderHook(() => useTripSplashBeats({ liveReducedMotion: true }));
    expect(result.current.reduceMotion).toBe(false);
    act(() => vi.advanceTimersByTime(SPLASH_STEP_MS));
    expect(result.current.activeIndex).toBe(1);
  });
});
