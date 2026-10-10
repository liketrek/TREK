import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHook, act } from '@testing-library/react';
import { useIsPhone, isPhoneViewport, PHONE_QUERY } from '../../../src/mobile/useIsPhone';

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

  it('FE-MOB-PHONE-001: returns true when the viewport matches the phone query', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsPhone());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(PHONE_QUERY);
  });

  it('FE-MOB-PHONE-004: a phone on its side stays a phone, a tablet and a desktop window do not', () => {
    // Real media query semantics for the three viewports that matter, evaluated
    // by hand: jsdom does not implement pointer or height features.
    const viewports = {
      phoneLandscape: { width: 932, height: 430, coarse: true },
      tabletLandscape: { width: 1180, height: 820, coarse: true },
      shortDesktopWindow: { width: 900, height: 450, coarse: false },
    };
    const evaluate = (v: { width: number; height: number; coarse: boolean }) =>
      PHONE_QUERY.split(',').some(part => {
        const p = part.trim();
        if (p === '(max-width: 767px)') return v.width <= 767;
        if (p === '(pointer: coarse) and (max-height: 500px)') return v.coarse && v.height <= 500;
        throw new Error(`unexpected query part ${p}`);
      });
    expect(evaluate(viewports.phoneLandscape)).toBe(true);
    expect(evaluate(viewports.tabletLandscape)).toBe(false);
    expect(evaluate(viewports.shortDesktopWindow)).toBe(false);
  });

  it('FE-MOB-PHONE-006: the phone rules in the stylesheets use the same query as the shell', () => {
    for (const file of ['src/index.css', 'src/components/Files/FileManager.tsx']) {
      const source = readFileSync(resolve(__dirname, '../../..', file), 'utf8');
      const queries = [...source.matchAll(/@media ([^{]*max-width: 767px[^{]*)\{/g)].map(m => m[1].trim());
      expect(queries.length).toBeGreaterThan(0);
      for (const q of queries) expect([PHONE_QUERY, '(max-width: 767px), (pointer: coarse)']).toContain(q);
    }
  });

  it('FE-MOB-PHONE-005: isPhoneViewport answers outside React, and false without matchMedia', () => {
    mockMatchMedia(true);
    expect(isPhoneViewport()).toBe(true);
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(isPhoneViewport()).toBe(false);
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
