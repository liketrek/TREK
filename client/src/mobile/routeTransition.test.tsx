import { act, renderHook } from '@testing-library/react';
import { NavigationType, type Location } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skipNextRouteTransition, transitionKind, useRouteTransition } from './routeTransition';

const loc = (pathname: string, key = pathname): Location => ({ pathname, key, search: '', hash: '', state: null });

describe('transitionKind', () => {
  it('slides deeper pages forward and back, cross-fades between sections', () => {
    expect(transitionKind(loc('/dashboard'), loc('/trips/4'), NavigationType.Push)).toBe('forward');
    expect(transitionKind(loc('/trips/4'), loc('/dashboard'), NavigationType.Pop)).toBe('back');
    expect(transitionKind(loc('/trips/4'), loc('/trips/4/files'), NavigationType.Push)).toBe('forward');
    expect(transitionKind(loc('/dashboard'), loc('/atlas'), NavigationType.Push)).toBe('tab');
    expect(transitionKind(loc('/vacay'), loc('/dashboard'), NavigationType.Pop)).toBe('tab');
  });
});

describe('useRouteTransition', () => {
  let start: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    start = vi.fn((update: () => Promise<void>) => {
      const done = update();
      return { finished: done, ready: done, updateCallbackDone: done, skipTransition: vi.fn() };
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true, writable: true });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
  });
  afterEach(() => {
    delete (document as { startViewTransition?: unknown }).startViewTransition;
    vi.unstubAllGlobals();
  });

  function render(initial: Location, enabled = true) {
    return renderHook(
      ({ location, type }: { location: Location; type: NavigationType }) => useRouteTransition(location, type, enabled),
      { initialProps: { location: initial, type: NavigationType.Push } }
    );
  }

  it('swaps the page inside a view transition and marks its direction', async () => {
    const hook = render(loc('/dashboard'));
    await act(async () => {
      hook.rerender({ location: loc('/trips/1'), type: NavigationType.Push });
    });
    expect(start).toHaveBeenCalledTimes(1);
    expect(hook.result.current.pathname).toBe('/trips/1');
  });

  it('goes without a transition after the edge swipe, on the same page and when off', async () => {
    const hook = render(loc('/trips/1'));
    skipNextRouteTransition();
    await act(async () => {
      hook.rerender({ location: loc('/dashboard'), type: NavigationType.Pop });
    });
    await act(async () => {
      hook.rerender({ location: { ...loc('/dashboard', 'k2'), search: '?f=1' }, type: NavigationType.Push });
    });
    expect(start).not.toHaveBeenCalled();
    expect(hook.result.current.key).toBe('k2');

    const off = render(loc('/dashboard'), false);
    off.rerender({ location: loc('/trips/2'), type: NavigationType.Push });
    expect(off.result.current.pathname).toBe('/trips/2');
    expect(start).not.toHaveBeenCalled();
  });
});
