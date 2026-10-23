// FE-UTIL-MOTION-001 to 002: the one reading of "reduce motion", the app's switch or the system's.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from './reducedMotion';

function stubMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }) as MediaQueryList);
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-reduce-motion');
});

describe('prefersReducedMotion', () => {
  it('FE-UTIL-MOTION-001: follows the system setting when the app says nothing', () => {
    stubMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    stubMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("FE-UTIL-MOTION-002: the app's own switch wins over a system that allows motion", () => {
    stubMedia(false);
    document.documentElement.setAttribute('data-reduce-motion', '');
    expect(prefersReducedMotion()).toBe(true);
  });
});
