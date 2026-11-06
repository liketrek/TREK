import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../native/haptics', () => ({ tickHaptic: vi.fn() }));
vi.mock('./overlayStack', () => ({ hasOpenOverlay: vi.fn(() => false) }));

import { tickHaptic } from '../native/haptics';
import { hasOpenOverlay } from './overlayStack';
import { usePullToRefresh } from './usePullToRefresh';

function touch(type: string, x = 0, y = 0) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function setup() {
  const el = document.createElement('div');
  const ref = { current: el };
  const onRefresh = vi.fn(async () => {});
  const hook = renderHook(() => usePullToRefresh(ref, onRefresh));
  return { el, onRefresh, hook };
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  vi.mocked(tickHaptic).mockClear();
  vi.mocked(hasOpenOverlay).mockReturnValue(false);
});
afterEach(() => vi.useRealTimers());

describe('usePullToRefresh', () => {
  it('springs back without refreshing after a short pull', () => {
    const { el, onRefresh } = setup();
    touch('touchstart', 100, 100);
    const move = touch('touchmove', 100, 160);
    expect(move.defaultPrevented).toBe(true);
    expect(el.style.transform).toContain('translate3d');
    touch('touchend');
    expect(onRefresh).not.toHaveBeenCalled();
    expect(el.style.transform).toBe('');
  });

  it('arms with a tick past the threshold and refreshes on release', async () => {
    const { onRefresh, hook } = setup();
    touch('touchstart', 100, 100);
    touch('touchmove', 100, 400);
    expect(tickHaptic).toHaveBeenCalledTimes(1);
    expect(hook.result.current.armed).toBe(true);
    touch('touchend');
    expect(hook.result.current.refreshing).toBe(true);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(hook.result.current.refreshing).toBe(false);
  });

  it('leaves sideways drags, scrolled pages and open sheets alone', () => {
    const { el, onRefresh } = setup();
    touch('touchstart', 100, 100);
    expect(touch('touchmove', 200, 120).defaultPrevented).toBe(false);
    touch('touchend');

    Object.defineProperty(window, 'scrollY', { value: 40, configurable: true });
    touch('touchstart', 100, 100);
    touch('touchmove', 100, 400);
    touch('touchend');

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    vi.mocked(hasOpenOverlay).mockReturnValue(true);
    touch('touchstart', 100, 100);
    touch('touchmove', 100, 400);
    touch('touchend');

    expect(onRefresh).not.toHaveBeenCalled();
    expect(el.style.transform).toBe('');
  });
});
