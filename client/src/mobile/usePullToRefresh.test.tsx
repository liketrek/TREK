import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../native/haptics', () => ({ tickHaptic: vi.fn() }));
vi.mock('./overlayStack', () => ({ hasOpenOverlay: vi.fn(() => false) }));

import { tickHaptic } from '../native/haptics';
import { hasOpenOverlay } from './overlayStack';
import { insideScrolledBox, usePullToRefresh } from './usePullToRefresh';

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

  it('leaves a pull that starts in a scrolled column of its own to that column', () => {
    const { onRefresh } = setup();
    const column = document.createElement('div');
    column.style.overflowY = 'auto';
    Object.defineProperty(column, 'scrollTop', { value: 300, configurable: true });
    Object.defineProperty(column, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(column, 'clientHeight', { value: 600, configurable: true });
    const card = document.createElement('div');
    column.appendChild(card);
    document.body.appendChild(column);
    const fire = (type: string, y: number) => {
      const event = new Event(type, { cancelable: true, bubbles: true });
      Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [{ clientX: 100, clientY: y }] });
      act(() => {
        card.dispatchEvent(event);
      });
      return event;
    };
    fire('touchstart', 100);
    expect(fire('touchmove', 400).defaultPrevented).toBe(false);
    fire('touchend', 400);
    vi.runAllTimers();
    expect(onRefresh).not.toHaveBeenCalled();
    column.remove();
  });

  it('counts a box as scrolled only when it scrolls on its own and is off its top', () => {
    const box = document.createElement('div');
    const inner = document.createElement('div');
    box.appendChild(inner);
    document.body.appendChild(box);
    Object.defineProperty(box, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 600, configurable: true });
    Object.defineProperty(box, 'scrollTop', { value: 50, configurable: true });
    expect(insideScrolledBox(inner, null)).toBe(false);
    box.style.overflowY = 'auto';
    expect(insideScrolledBox(inner, null)).toBe(true);
    expect(insideScrolledBox(inner, box)).toBe(false);
    Object.defineProperty(box, 'scrollTop', { value: 0, configurable: true });
    expect(insideScrolledBox(inner, null)).toBe(false);
    expect(insideScrolledBox(null, null)).toBe(false);
    box.remove();
  });

  it('reads the scroll position of its own scroll box when given one', () => {
    const el = document.createElement('div');
    const scroller = document.createElement('div');
    Object.defineProperty(scroller, 'scrollTop', { value: 120, configurable: true });
    const onRefresh = vi.fn(async () => {});
    renderHook(() => usePullToRefresh({ current: el }, onRefresh, true, { current: scroller }));
    touch('touchstart', 100, 100);
    expect(touch('touchmove', 100, 400).defaultPrevented).toBe(false);
    touch('touchend');
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('holds a clearly downward move at the top from its first pixel, so the bounce does not start under the pull', () => {
    setup();
    touch('touchstart', 100, 100);
    expect(touch('touchmove', 100, 103).defaultPrevented).toBe(true);
    touch('touchend');
  });

  it('leaves the bounce everywhere else: a sideways start, and the page once it is scrolled', () => {
    setup();
    touch('touchstart', 100, 100);
    expect(touch('touchmove', 104, 102).defaultPrevented).toBe(false);
    touch('touchend');
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
    touch('touchstart', 100, 100);
    expect(touch('touchmove', 100, 103).defaultPrevented).toBe(false);
    touch('touchend');
    expect(document.documentElement.hasAttribute('data-pull-refresh')).toBe(false);
  });
});
