import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsPhone } from '../../../src/mobile/useIsPhone';

// FE-MOB-PHONE-001 onwards

type ChangeListener = (e: { matches: boolean }) => void;

function mockMatchMedia(matches: boolean) {
  let listener: ChangeListener | null = null;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_event: string, cb: ChangeListener) => { listener = cb; },
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  return { fire: (m: boolean) => act(() => listener?.({ matches: m })) };
}

const originalMatchMedia = window.matchMedia;

describe('useIsPhone', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('FE-MOB-PHONE-001: returns true when the viewport matches (max-width: 767px)', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('FE-MOB-PHONE-002: returns false on wider viewports', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(false);
  });

  it('FE-MOB-PHONE-003: reacts to media query changes', () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(false);

    mq.fire(true);
    expect(result.current).toBe(true);

    mq.fire(false);
    expect(result.current).toBe(false);
  });
});
