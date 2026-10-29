// FE-HOOK-VISIBLE-001 to FE-HOOK-VISIBLE-003
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useElementVisible } from './useElementVisible';

let report: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    report = callback;
  }
  observe() {}
  disconnect() {
    disconnect();
  }
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  vi.unstubAllGlobals();
  setVisibility('visible');
  report = null;
});

describe('useElementVisible', () => {
  it('FE-HOOK-VISIBLE-001: follows the element in and out of view', () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const target = { current: document.createElement('div') };
    const { result, unmount } = renderHook(() => useElementVisible(target));
    act(() => report?.([{ isIntersecting: false }]));
    expect(result.current).toBe(false);
    act(() => report?.([{ isIntersecting: true }]));
    expect(result.current).toBe(true);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('FE-HOOK-VISIBLE-002: counts as hidden while the tab is in the background', () => {
    const target = { current: document.createElement('div') };
    const { result } = renderHook(() => useElementVisible(target));
    expect(result.current).toBe(true);
    act(() => setVisibility('hidden'));
    expect(result.current).toBe(false);
    act(() => setVisibility('visible'));
    expect(result.current).toBe(true);
  });

  it('FE-HOOK-VISIBLE-003: without IntersectionObserver the element counts as on screen', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { result } = renderHook(() => useElementVisible({ current: document.createElement('div') }));
    expect(result.current).toBe(true);
  });
});
